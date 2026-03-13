import { useEffect, useCallback, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { setSyncFunctions, setUserInfo, flushOfflineQueue } from '../lib/syncBridge'
import { syncPushSubscription } from '../lib/pushSubscription'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { useMonthlyStore } from '../stores/monthlyStore'
import { useSavingsStore } from '../stores/savingsStore'
import { useExpenseStore } from '../stores/expenseStore'
import { useNotificationStore } from '../stores/notificationStore'
import { useDashboardLayoutStore } from '../stores/dashboardLayoutStore'
import { toast } from 'sonner'
import type { Household, MonthlyEntry, FixedCharge, InstallmentPayment, PlannedExpense, SavingsGoal, Expense, AppNotification } from '../types'
import type { Session } from '@supabase/supabase-js'

type SnakeCase = Record<string, unknown>

function camelToSnake(obj: Record<string, unknown>): SnakeCase {
  const result: SnakeCase = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    result[snakeKey] = value
  }
  return result
}

function snakeToCamel<T = Record<string, unknown>>(obj: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
    result[camelKey] = value
  }
  return result as T
}

export function useSupabaseSync(session: Session | null) {
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [memberRole, setMemberRole] = useState<string | null>(null)
  const [memberCount, setMemberCount] = useState(0)

  const loadFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase || !session?.user) return null

    try {
      const { data: memberships } = await supabase
        .from('household_members')
        .select('household_id, role')
        .eq('user_id', session.user.id)

      if (!memberships?.length) return null

      const hId = memberships[0].household_id as string
      const role = memberships[0].role as string
      setHouseholdId(hId)
      setMemberRole(role)

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
        const h = snakeToCamel<Household>(household)
        useHouseholdStore.setState({
          household: {
            ...h,
            splitRatio: Number(h.splitRatio),
            currency: h.currency || 'EUR',
          },
        })
      }

      if (fixedCharges) {
        useChargesStore.setState({
          fixedCharges: fixedCharges.map((c) => snakeToCamel<FixedCharge>(c)),
        })
      }

      if (installments) {
        useChargesStore.setState({
          installmentPayments: installments.map((i) => snakeToCamel<InstallmentPayment>(i)),
        })
      }

      if (planned) {
        useChargesStore.setState({
          plannedExpenses: planned.map((p) => snakeToCamel<PlannedExpense>(p)),
        })
      }

      if (monthlyEntries) {
        const entries: Record<string, MonthlyEntry> = {}
        monthlyEntries.forEach((e) => {
          const entry = snakeToCamel<MonthlyEntry>(e)
          entries[entry.month] = {
            month: entry.month,
            incomeA: Number(entry.incomeA) || 0,
            incomeB: Number(entry.incomeB) || 0,
            startingBalanceA: Number(entry.startingBalanceA) || 0,
            startingBalanceB: Number(entry.startingBalanceB) || 0,
            otherIncomeCommon: Number(entry.otherIncomeCommon) || 0,
            otherIncomeA: Number(entry.otherIncomeA) || 0,
            otherIncomeB: Number(entry.otherIncomeB) || 0,
            transferredA: Number(entry.transferredA) || 0,
            transferredB: Number(entry.transferredB) || 0,
            variableOverrides: entry.variableOverrides || {},
            disabledCharges: entry.disabledCharges || [],
            chargeSnapshot: entry.chargeSnapshot || null,
            snapshottedAt: entry.snapshottedAt || null,
          }
        })
        useMonthlyStore.setState({ entries })
      }

      if (goals) {
        useSavingsStore.setState({
          goals: goals.map((g) => {
            const goal = snakeToCamel<SavingsGoal>(g)
            return {
              ...goal,
              targetAmount: Number(goal.targetAmount),
              currentAmount: Number(goal.currentAmount),
            }
          }),
        })
      }

      if (expenses) {
        useExpenseStore.setState({
          expenses: expenses.map((e) => {
            const exp = snakeToCamel<Expense>(e)
            return { ...exp, amount: Number(exp.amount) }
          }),
        })
      }

      if (rules) {
        const categoryRules: Record<string, string> = {}
        rules.forEach((r) => { categoryRules[r.pattern as string] = r.category as string })
        useChargesStore.setState({ categoryRules })
      }

      await useDashboardLayoutStore.getState().loadFromDB(session.user.id, hId)
      syncPushSubscription(session.user.id).catch(() => {})

      return hId
    } catch (err) {
      console.error('Supabase sync error:', err)
      toast.error('Erreur de synchronisation. Vos données locales sont affichées.')
      return null
    }
  }, [session])

  const saveHousehold = useCallback(async (household: Household) => {
    if (!isSupabaseConfigured() || !supabase || !session?.user || !householdId) return
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

  const createHousehold = useCallback(async (household: Household) => {
    if (!isSupabaseConfigured() || !supabase || !session?.user) return null

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

    const { error: memberError } = await supabase.from('household_members').insert({
      household_id: household.id,
      user_id: session.user.id,
      role: 'owner',
    })

    if (memberError) { console.error('Create member error:', memberError); return null }

    setHouseholdId(household.id)
    return household.id
  }, [session])

  const syncItem = useCallback(async (table: string, item: Record<string, unknown>) => {
    if (!isSupabaseConfigured() || !supabase || !householdId) return
    const data: SnakeCase = { ...camelToSnake(item), household_id: householdId }
    delete data.created_at
    data.updated_at = new Date().toISOString()
    const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' })
    if (error) throw error
  }, [householdId])

  const deleteItem = useCallback(async (table: string, id: string) => {
    if (!isSupabaseConfigured() || !supabase || !householdId) return
    const { error } = await supabase.from(table).delete().eq('id', id).eq('household_id', householdId)
    if (error) throw error
  }, [householdId])

  const FIELD_MAP: Record<string, string> = {
    incomeA: 'income_a', incomeB: 'income_b',
    startingBalanceA: 'starting_balance_a', startingBalanceB: 'starting_balance_b',
    otherIncomeCommon: 'other_income_common', otherIncomeA: 'other_income_a', otherIncomeB: 'other_income_b',
    transferredA: 'transferred_a', transferredB: 'transferred_b',
    variableOverrides: 'variable_overrides',
    disabledCharges: 'disabled_charges',
    chargeSnapshot: 'charge_snapshot',
    snapshottedAt: 'snapshotted_at',
  }

  const syncMonthlyEntry = useCallback(async (month: string, entry: Partial<MonthlyEntry>, changedFields: Set<string> | null = null) => {
    if (!isSupabaseConfigured() || !supabase || !householdId) return

    if (changedFields && changedFields.size > 0) {
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
      for (const field of changedFields) {
        const col = FIELD_MAP[field]
        if (col) {
          const val = (entry as Record<string, unknown>)[field]
          if (field === 'variableOverrides') update[col] = val || {}
          else if (field === 'disabledCharges') update[col] = val || []
          else if (field === 'chargeSnapshot') update[col] = val || null
          else if (field === 'snapshottedAt') update[col] = val || null
          else update[col] = val || 0
        }
      }

      const { data } = await supabase.from('monthly_entries')
        .update(update)
        .eq('household_id', householdId)
        .eq('month', month)
        .select('id')

      if (!data?.length) {
        await supabase.from('monthly_entries').upsert({
          household_id: householdId,
          month,
          income_a: entry.incomeA || 0,
          income_b: entry.incomeB || 0,
          starting_balance_a: entry.startingBalanceA || 0,
          starting_balance_b: entry.startingBalanceB || 0,
          other_income_common: entry.otherIncomeCommon || 0,
          other_income_a: entry.otherIncomeA || 0,
          other_income_b: entry.otherIncomeB || 0,
          transferred_a: entry.transferredA || 0,
          transferred_b: entry.transferredB || 0,
          variable_overrides: entry.variableOverrides || {},
          disabled_charges: entry.disabledCharges || [],
          charge_snapshot: entry.chargeSnapshot || null,
          snapshotted_at: entry.snapshottedAt || null,
        }, { onConflict: 'household_id,month' })
      }
    } else {
      await supabase.from('monthly_entries').upsert({
        household_id: householdId,
        month,
        income_a: entry.incomeA || 0,
        income_b: entry.incomeB || 0,
        starting_balance_a: entry.startingBalanceA || 0,
        starting_balance_b: entry.startingBalanceB || 0,
        other_income_common: entry.otherIncomeCommon || 0,
        other_income_a: entry.otherIncomeA || 0,
        other_income_b: entry.otherIncomeB || 0,
        transferred_a: entry.transferredA || 0,
        transferred_b: entry.transferredB || 0,
        variable_overrides: entry.variableOverrides || {},
        disabled_charges: entry.disabledCharges || [],
        charge_snapshot: entry.chargeSnapshot || null,
        snapshotted_at: entry.snapshottedAt || null,
      }, { onConflict: 'household_id,month' })
    }
  }, [householdId])

  useEffect(() => {
    if (!isSupabaseConfigured() || !householdId) return
    setSyncFunctions(syncItem, deleteItem, syncMonthlyEntry)
    const household = useHouseholdStore.getState().household
    const fallbackName = memberRole === 'member'
      ? household?.personBName
      : household?.personAName
    const userName = session?.user?.user_metadata?.name
      || session?.user?.user_metadata?.full_name
      || fallbackName
      || session?.user?.email?.split('@')[0]
      || 'Quelqu\'un'
    setUserInfo(session?.user?.id ?? '', userName as string, householdId)

    flushOfflineQueue().then((count) => {
      if (count > 0) console.log(`Flushed ${count} offline pending write(s)`)
    })

    return () => {
      setSyncFunctions(null as unknown as Parameters<typeof setSyncFunctions>[0], null as unknown as Parameters<typeof setSyncFunctions>[1])
      setUserInfo('', '', '')
    }
  }, [syncItem, deleteItem, syncMonthlyEntry, householdId, memberRole, session])

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase || !householdId || !session?.user) return

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

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase || !householdId) return

    let timer: ReturnType<typeof setTimeout> | null = null
    const debouncedReload = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => { loadFromSupabase() }, 500)
    }

    const tables = [
      'fixed_charges', 'installment_payments', 'planned_expenses',
      'monthly_entries', 'savings_goals', 'expenses', 'households',
      'category_rules',
    ]

    let channel = supabase.channel(`household-sync-${Date.now()}`)
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    const setupChannel = () => {
      if (channel) {
        supabase!.removeChannel(channel)
      }
      channel = supabase!.channel(`household-sync-${Date.now()}`)
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
          reconnectTimer = setTimeout(setupChannel, 3000)
        }
      })
    }

    setupChannel()

    return () => {
      if (timer) clearTimeout(timer)
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (channel) supabase!.removeChannel(channel)
    }
  }, [householdId, loadFromSupabase])

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase || !householdId || !session?.user) return

    const loadNotifications = async () => {
      const { data } = await supabase!
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (data) {
        useNotificationStore.getState().setNotifications(
          data.map((n) => snakeToCamel<AppNotification>(n))
        )
      }
    }
    loadNotifications()

    const channel = supabase
      .channel('user-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${session.user.id}`,
      }, (payload) => {
        const notif = snakeToCamel<AppNotification>(payload.new as Record<string, unknown>)
        useNotificationStore.getState().addNotification(notif)
        toast(notif.title, { description: notif.body || undefined })
      })
      .subscribe()

    return () => {
      supabase!.removeChannel(channel)
    }
  }, [householdId, session])

  const createInvite = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase || !session?.user || !householdId) return null
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

  const acceptInvite = useCallback(async (code: string) => {
    if (!isSupabaseConfigured() || !supabase || !session?.user) return { error: 'not_configured' }

    code = code.trim().toUpperCase()
    if (!code || !/^[A-Z2-9]{8}$/.test(code)) return { error: 'invalid_code' }

    const { data: invite, error: lookupError } = await supabase
      .from('household_invites')
      .select('*')
      .eq('code', code)
      .eq('status', 'pending')
      .single()

    if (lookupError || !invite) return { error: 'not_found' }

    if (invite.expires_at && new Date(invite.expires_at as string) < new Date()) return { error: 'expired' }

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

    await supabase.from('household_invites')
      .update({ status: 'accepted', used_by: session.user.id })
      .eq('id', invite.id)

    setHouseholdId(invite.household_id as string)
    await loadFromSupabase()
    return { householdId: invite.household_id as string }
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
