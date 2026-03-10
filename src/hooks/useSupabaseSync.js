import { useEffect, useCallback, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { setSyncFunctions } from '../lib/syncBridge'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { useMonthlyStore } from '../stores/monthlyStore'
import { useSavingsStore } from '../stores/savingsStore'
import { useExpenseStore } from '../stores/expenseStore'

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
        supabase.from('expenses').select('*').eq('household_id', hId).order('created_at', { ascending: false }),
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

      return hId
    } catch (err) {
      console.error('Supabase sync error:', err)
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
    await supabase.from(table).upsert(data, { onConflict: 'id' })
  }, [householdId])

  const deleteItem = useCallback(async (table, id) => {
    if (!isSupabaseConfigured()) return
    await supabase.from(table).delete().eq('id', id)
  }, [])

  const syncMonthlyEntry = useCallback(async (month, entry) => {
    if (!isSupabaseConfigured() || !householdId) return
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
  }, [householdId])

  // Activate sync bridge so stores auto-sync to Supabase
  useEffect(() => {
    if (!isSupabaseConfigured() || !householdId) return
    setSyncFunctions(syncItem, deleteItem)
    return () => setSyncFunctions(null, null)
  }, [syncItem, deleteItem, householdId])

  // Real-time subscriptions
  useEffect(() => {
    if (!isSupabaseConfigured() || !householdId) return

    // Debounce reloads — multiple rapid changes (e.g. batch import) only trigger one reload
    let timer = null
    const debouncedReload = () => {
      clearTimeout(timer)
      timer = setTimeout(() => loadFromSupabase(), 500)
    }

    const tables = [
      'fixed_charges', 'installment_payments', 'planned_expenses',
      'monthly_entries', 'savings_goals', 'expenses', 'households',
    ]

    let channel = supabase.channel('household-sync')
    tables.forEach((table) => {
      channel = channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table,
        filter: `household_id=eq.${householdId}`,
      }, debouncedReload)
    })
    channel.subscribe()

    return () => {
      clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [householdId, loadFromSupabase])

  const createInvite = useCallback(async () => {
    if (!isSupabaseConfigured() || !session?.user || !householdId) return null
    // Generate short readable code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]

    const { error } = await supabase.from('household_invites').insert({
      household_id: householdId,
      code,
      created_by: session.user.id,
    })
    if (error) { console.error('Create invite error:', error); return null }
    return code
  }, [session, householdId])

  const acceptInvite = useCallback(async (code) => {
    if (!isSupabaseConfigured() || !session?.user) return null

    // Look up invite
    const { data: invite, error: lookupError } = await supabase
      .from('household_invites')
      .select('*')
      .eq('code', code)
      .eq('status', 'pending')
      .single()

    if (lookupError || !invite) return null

    // Check not expired
    if (new Date(invite.expires_at) < new Date()) return null

    // Add user to household (ignore duplicate — they may already be a member)
    const { error: memberError } = await supabase.from('household_members').insert({
      household_id: invite.household_id,
      user_id: session.user.id,
      role: 'member',
    })
    if (memberError && !memberError.message?.includes('duplicate')) {
      console.error('Join household error:', memberError)
      return null
    }

    // Mark invite as accepted
    await supabase.from('household_invites')
      .update({ status: 'accepted', used_by: session.user.id })
      .eq('id', invite.id)

    setHouseholdId(invite.household_id)
    // Load shared household data
    await loadFromSupabase()
    return invite.household_id
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
  }
}
