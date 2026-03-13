import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FORWARD_TO = Deno.env.get('FORWARD_EMAIL') || 'limlahi.fawsy@hotmail.fr'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const payload = await req.json()
    const { from, subject, html, text } = payload.data || payload

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Monest Contact <noreply@monest.dev>`,
        to: FORWARD_TO,
        subject: `[Contact Monest] ${subject || '(sans objet)'}`,
        html: html || `<pre>${text || 'Email vide'}</pre>`,
        reply_to: from,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return new Response(err, { status: 500 })
    }

    return new Response(JSON.stringify({ forwarded: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 })
  }
})
