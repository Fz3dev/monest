import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Encode VAPID keys and create JWT for Web Push authentication
 */
function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64UrlDecode(str: string): Uint8Array {
  const padding = '='.repeat((4 - (str.length % 4)) % 4)
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return output
}

async function importVapidKeys() {
  const privateKeyData = base64UrlDecode(VAPID_PRIVATE_KEY)
  const publicKeyData = base64UrlDecode(VAPID_PUBLIC_KEY)

  // Build JWK from raw keys
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x: base64UrlEncode(publicKeyData.slice(1, 33)),
    y: base64UrlEncode(publicKeyData.slice(33, 65)),
    d: base64UrlEncode(privateKeyData),
  }

  return await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
}

async function createVapidJwt(audience: string): Promise<string> {
  const key = await importVapidKeys()

  const header = { typ: 'JWT', alg: 'ES256' }
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: 'mailto:contact@monest.dev',
  }

  const enc = new TextEncoder()
  const headerB64 = base64UrlEncode(enc.encode(JSON.stringify(header)))
  const payloadB64 = base64UrlEncode(enc.encode(JSON.stringify(payload)))
  const unsigned = `${headerB64}.${payloadB64}`

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    enc.encode(unsigned)
  )

  // Convert DER signature to raw r || s (64 bytes)
  const sigArray = new Uint8Array(signature)
  let rawSig: Uint8Array

  if (sigArray.length === 64) {
    rawSig = sigArray
  } else {
    // DER-encoded signature → extract r and s
    const r = sigArray.slice(4, 4 + sigArray[3])
    const s = sigArray.slice(6 + sigArray[3])
    rawSig = new Uint8Array(64)
    rawSig.set(r.length === 33 ? r.slice(1) : r, 32 - Math.min(r.length, 32))
    rawSig.set(s.length === 33 ? s.slice(1) : s, 64 - Math.min(s.length, 32))
  }

  return `${unsigned}.${base64UrlEncode(rawSig)}`
}

async function sendPushToEndpoint(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: object
): Promise<{ success: boolean; status?: number; endpoint: string }> {
  try {
    const audience = new URL(subscription.endpoint).origin
    const jwt = await createVapidJwt(audience)

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'TTL': '86400',
        'Authorization': `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
        'Content-Encoding': 'aes128gcm',
      },
      body: JSON.stringify(payload),
    })

    return {
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      endpoint: subscription.endpoint,
    }
  } catch (err) {
    console.error('Push send error:', err)
    return { success: false, endpoint: subscription.endpoint }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_ids, title, body, url, tag } = await req.json()

    if (!user_ids?.length || !title) {
      return new Response(
        JSON.stringify({ error: 'user_ids and title are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get subscriptions for target users
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, user_id')
      .in('user_id', user_ids)

    if (error) throw error
    if (!subscriptions?.length) {
      return new Response(
        JSON.stringify({ sent: 0, message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload = { title, body, url: url || '/dashboard', tag: tag || 'monest-default', icon: '/pwa-192.png' }

    // Send to all subscriptions in parallel
    const results = await Promise.allSettled(
      subscriptions.map((sub) => sendPushToEndpoint(sub, payload))
    )

    // Clean up expired/invalid subscriptions (410 Gone)
    const expiredEndpoints = results
      .filter((r) => r.status === 'fulfilled' && r.value.status === 410)
      .map((r) => (r as PromiseFulfilledResult<any>).value.endpoint)

    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints)
    }

    const sent = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length

    return new Response(
      JSON.stringify({ sent, total: subscriptions.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('send-push error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
