import { useEffect, useCallback, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { setSyncFunctions, setUserInfo, flushOfflineQueue } from '../lib/syncBridge'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { useMonthlyStore } from '../stores/monthlyStore'
import { useSavingsStore } from '../stores/savingsStore'
import { useExpenseStore } from '../stores/expenseStore'
import { useNotificationStore } from '../stores/notificationStore'
import { useDashboardLayoutStore } from '../stores/dashboardLayoutStore'
import { toast } from 'sonner'

function camelToSnake(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(camelToSnake)
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    result[snakeKey] = value
  }
  return result
}

function snakeToCamel(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(snakeToCamel)
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    result[camelKey] = value
  }
  return result
}

export function useSupabaseSync(session) {
  const [householdId, setHouseholdId] = useState(null)
  const [memberCount, setMemberCount] = useState(0)

  const loadFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured() || !session?.user) return null

    try {
      const { data: memberships } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', session.user.id)

      if (!memberships?.length) return null

      const hId = memberships[0].household_id
      setHouseholdId(hId)

      // Count household members to know if solo or shared
      const { count } = await supabase
        .from('household_members')
        .select('*', { count: 'exact', head: true })
        .eq('household_id', hId)
      setMemberCount(count || 1)

      const [
        { data: household },
        { data: fixedCharges },
        { data: installments },
        { data: planned },
        { data: monthlyEntries },
        { data: goals },
        { data: expenses },
        { data: rules },
      ] = await Promise.all([
        supabase.from('households').select('*').eq('id', hId).single(),
        supabase.from('fixed_charges').select('*').eq('household_id', hId),
        supabase.from('installment_payments').select('*').eq('household_id', hId),
        supabase.from('planned_expenses').select('*').eq('household_id', hId),
        supabase.from('monthly_entries').select('*').eq('household_id', hId),
        supabase.from('savings_goals').select('*').eq('household_id', hId),
        supabase.from('expenses').select('*').eq('household_id', hId).order('created_at', { ascending: false }).limit(500),
        supabase.from('category_rules').select('*').eq('household_id', hId),
      ])

      if (household) {
        const h = snakeToCamel(household)
        useHouseholdStore.setState({
          household: {
            id: h.id,
            name: h.name,
            personAName: h.personAName,
            personAColor: h.personAColor,
            personBName: h.personBName,
            personBColor: h.personBColor,
            configModel: h.configModel,
            splitRatio: Number(h.splitRatio),
            splitMode: h.splitMode,
            currency: h.currency || 'EUR',
          },
        })
      }

      if (fixedCharges) {
        useChargesStore.setState({
          fixedCharges: fixedCharges.map((c) => snakeToCamel(c)),
        })
      }

      if (installments) {
        useChargesStore.setState({
          installmentPayments: installments.map((i) => snakeToCamel(i)),
        })
      }

      if (planned) {
        useChargesStore.setState({
          plannedExpenses: planned.map((p) => snakeToCamel(p)),
        })
      }

      if (monthlyEntries) {
        const entries = {}
        monthlyEntries.forEach((e) => {
          const entry = snakeToCamel(e)
          entries[entry.month] = {
            month: entry.month,
            incomeA: Number(entry.incomeA) || 0,
            incomeB: Number(entry.incomeB) || 0,
            startingBalanceA: Number(entry.startingBalanceA) || 0,
            startingBalanceB: Number(entry.startingBalanceB) || 0,
            transferredA: Number(entry.transferredA) || 0,
            transferredB: Number(entry.transferredB) || 0,
            variableOverrides: entry.variableOverrides || {},
          }
        })
        useMonthlyStore.setState({ entries })
      }

      if (goals) {
        useSavingsStore.setState({
          goals: goals.map((g) => ({
            ...snakeToCamel(g),
            targetAmount: Number(g.target_amount),
            currentAmount: Number(g.current_amount),
          })),
        })
      }

      if (expenses) {
        useExpenseStore.setState({
          expenses: expenses.map((e) => ({
            ...snakeToCamel(e),
            amount: Number(e.amount),
          })),
        })
      }

      if (rules) {
        const categoryRules = {}
        rules.forEach((r) => { categoryRules[r.pattern] = r.category })
        useChargesStore.setState({ categoryRules })
      }

      // Load user-specific dashboard layout
      await useDashboardLayoutStore.getState().loadFromDB(session.user.id, hId)

      return hId
    } catch (err) {
      console.error('Supabase sync error:', err)
      toast.error('Erreur de synchronisation. Vos données locales sont affichées.')
      return null
    }
  }, [session])

  const saveHousehold = useCallback(async (household) => {
    if (!isSupabaseConfigured() || !session?.user || !householdId) return
    const data = {
      name: household.name,
      person_a_name: household.personAName,
      person_a_color: household.personAColor,
      person_b_name: household.personBName || null,
      person_b_color: household.personBColor || null,
      config_model: household.configModel,
      split_ratio: household.splitRatio,
      split_mode: household.splitMode,
      currency: household.currency || 'EUR',
    }
    await supabase.from('households').update(data).eq('id', householdId)
  }, [session, householdId])

  const createHousehold = useCallback(async (household) => {
    if (!isSupabaseConfigured() || !session?.user) return null

    // Insert household first (no .select() — RLS SELECT requires membership which doesn't exist yet)
    const { error: insertError } = await supabase
      .from('households')
      .insert({
        id: household.id,
        name: household.name,
        person_a_name: household.personAName,
        person_a_color: household.personAColor,
        person_b_name: household.personBName || null,
        person_b_color: household.personBColor || null,
        config_model: household.configModel,
        split_ratio: household.splitRatio,
        split_mode: household.splitMode,
        currency: household.currency || 'EUR',
      })

    if (insertError) { console.error('Create household error:', insertError); return null }

    // Now add user as owner — after this, SELECT RLS will work
    const { error: memberError } = await supabase.from('household_members').insert({
      household_id: household.id,
      user_id: session.user.id,
      role: 'owner',
    })

    if (memberError) { console.error('Create member error:', memberError); return null }

    setHouseholdId(household.id)
    return household.id
  }, [session])

  const syncItem = useCallback(async (table, item) => {
    if (!isSupabaseConfigured() || !householdId) return
    const data = { ...camelToSnake(item), household_id: householdId }
    delete data.created_at
    data.updated_at = new Date().toISOString()
    const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' })
    if (error) throw error
  }, [householdId])

  const deleteItem = useCallback(async (table, id) => {
    if (!isSupabaseConfigured()) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
  }, [])

  const syncMonthlyEntry = useCallback(async (month, entry, changedFields = null) => {
    if (!isSupabaseConfigured() || !householdId) return

    const FIELD_MAP = {
      incomeA: 'income_a', incomeB: 'income_b',
      startingBalanceA: 'starting_balance_a', startingBalanceB: 'starting_balance_b',
      transferredA: 'transferred_a', transferredB: 'transferred_b',
      variableOverrides: 'variable_overrides',
    }

    // Field-level UPDATE when we know which fields changed (prevents overwriting partner's data)
    if (changedFields && changedFields.size > 0) {
      const update = { updated_at: new Date().toISOString() }
      for (const field of changedFields) {
        const col = FIELD_MAP[field]
        if (col) {
          update[col] = field === 'variableOverrides' ? (entry[field] || {}) : (entry[field] || 0)
        }
      }

      // Try UPDATE first (entry already exists)
      const { data } = await supabase.from('monthly_entries')
        .update(update)
        .eq('household_id', householdId)
        .eq('month', month)
        .select('id')

      // If no row matched, entry doesn't exist yet — do full INSERT
      if (!data?.length) {
        await supabase.from('monthly_entries').upsert({
          household_id: householdId,
          month,
          income_a: entry.incomeA || 0,
          income_b: entry.incomeB || 0,
          starting_balance_a: entry.startingBalanceA || 0,
          starting_balance_b: entry.startingBalanceB || 0,
          transferred_a: entry.transferredA || 0,
          transferred_b: entry.transferredB || 0,
          variable_overrides: entry.variableOverrides || {},
        }, { onConflict: 'household_id,month' })
      }
    } else {
      // Full upsert fallback (offline flush, bulk import, etc.)
      await supabase.from('monthly_entries').upsert({
        household_id: householdId,
        month,
        income_a: entry.incomeA || 0,
        income_b: entry.incomeB || 0,
        starting_balance_a: entry.startingBalanceA || 0,
        starting_balance_b: entry.startingBalanceB || 0,
        transferred_a: entry.transferredA || 0,
        transferred_b: entry.transferredB || 0,
        variable_overrides: entry.variableOverrides || {},
      }, { onConflict: 'household_id,month' })
    }
  }, [householdId])

  // Activate sync bridge so stores auto-sync to Supabase
  useEffect(() => {
    if (!isSupabaseConfigured() || !householdId) return
    setSyncFunctions(syncItem, deleteItem, syncMonthlyEntry)
    // Pass user info for notifications
    const household = useHouseholdStore.getState().household
    const userName = session?.user?.user_metadata?.name
      || session?.user?.user_metadata?.full_name
      || household?.personAName
      || session?.user?.email?.split('@')[0]
      || 'Quelqu\'un'
    setUserInfo(session?.user?.id, userName, householdId)

    // Flush any pending offline writes now that sync functions are available
    flushOfflineQueue().then((count) => {
      if (count > 0) console.log(`Flushed ${count} offline pending write(s)`)
    })

    return () => {
      setSyncFunctions(null, null, null)
      setUserInfo(null, null, null)
    }
  }, [syncItem, deleteItem, syncMonthlyEntry, householdId, session])

  // Sync dashboard layout changes to Supabase (debounced)
  useEffect(() => {
    if (!isSupabaseConfigured() || !householdId || !session?.user) return

    let prevLayouts = JSON.stringify(useDashboardLayoutStore.getState().layouts)

    const unsub = useDashboardLayoutStore.subscribe((state) => {
      const next = JSON.stringify(state.layouts)
      if (next !== prevLayouts) {
        prevLayouts = next
        state.scheduleSaveToDB(session.user.id, householdId)
      }
    })

    return () => unsub()
  }, [householdId, session])

  // Real-time subscriptions
  useEffect(() => {
    if (!isSupabaseConfigured() || !householdId) return

    // Debounce reloads — multiple rapid changes (e.g. batch import) only trigger one reload
    let timer = null
    const debouncedReload = () => {
      clearTimeout(timer)
      timer = setTimeout(() => { loadFromSupabase() }, 500)
    }

    const tables = [
      'fixed_charges', 'installment_payments', 'planned_expenses',
      'monthly_entries', 'savings_goals', 'expenses', 'households',
      'category_rules',
    ]

    let channel = null
    let reconnectTimer = null

    const setupChannel = () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
      channel = supabase.channel(`household-sync-${Date.now()}`)
      tables.forEach((table) => {
        channel = channel.on('postgres_changes', {
          event: '*',
          schema: 'public',
          table,
          filter: `household_id=eq.${householdId}`,
        }, debouncedReload)
      })
      channel.subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Reconnect after 3 seconds
          reconnectTimer = setTimeout(setupChannel, 3000)
        }
      })
    }

    setupChannel()

    return () => {
      clearTimeout(timer)
      clearTimeout(reconnectTimer)
      if (channel) supabase.removeChannel(channel)
    }
  }, [householdId, loadFromSupabase])

  // Load & subscribe to notifications
  useEffect(() => {
    if (!isSupabaseConfigured() || !householdId || !session?.user) return

    // Load existing notifications
    const loadNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (data) {
        useNotificationStore.getState().setNotifications(data)
      }
    }
    loadNotifications()

    // Real-time subscription for new notifications
    const channel = supabase
      .channel('user-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${session.user.id}`,
      }, (payload) => {
        const notif = payload.new
        useNotificationStore.getState().addNotification(notif)
        // Show toast for new notification
        toast(notif.title, { description: notif.body || undefined })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [householdId, session])

  const createInvite = useCallback(async () => {
    if (!isSupabaseConfigured() || !session?.user || !householdId) return null
    // Generate short readable code (crypto-secure)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const bytes = crypto.getRandomValues(new Uint8Array(8))
    let code = ''
    for (let i = 0; i < 8; i++) code += chars[bytes[i] % chars.length]

    const { error } = await supabase.from('household_invites').insert({
      household_id: householdId,
      code,
      created_by: session.user.id,
    })
    if (error) { console.error('Create invite error:', error); return null }
    return code
  }, [session, householdId])

  const acceptInvite = useCallback(async (code) => {
    if (!isSupabaseConfigured() || !session?.user) return { error: 'not_configured' }

    // Normalize and validate code format (8 chars alphanumeric)
    code = code.trim().toUpperCase()
    if (!code || !/^[A-Z2-9]{8}$/.test(code)) return { error: 'invalid_code' }

    // Look up invite
    const { data: invite, error: lookupError } = await supabase
      .from('household_invites')
      .select('*')
      .eq('code', code)
      .eq('status', 'pending')
      .single()

    if (lookupError || !invite) return { error: 'not_found' }

    // Check not expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) return { error: 'expired' }

    // Add user to household (ignore duplicate — they may already be a member)
    const { error: memberError } = await supabase.from('household_members').insert({
      household_id: invite.household_id,
      user_id: session.user.id,
      role: 'member',
    })

    const isDuplicate = memberError?.message?.includes('duplicate') || memberError?.code === '23505'
    if (memberError && !isDuplicate) {
      console.error('Join household error:', memberError)
      return { error: 'join_failed' }
    }

    // Only mark invite as accepted if member was actually added (or already a member)
    await supabase.from('household_invites')
      .update({ status: 'accepted', used_by: session.user.id })
      .eq('id', invite.id)

    setHouseholdId(invite.household_id)
    // Load shared household data
    await loadFromSupabase()
    return { householdId: invite.household_id }
  }, [session, loadFromSupabase])

  return {
    loadFromSupabase,
    saveHousehold,
    createHousehold,
    createInvite,
    acceptInvite,
    syncItem,
    deleteItem,
    syncMonthlyEntry,
    householdId,
    memberCount,
  }
}
