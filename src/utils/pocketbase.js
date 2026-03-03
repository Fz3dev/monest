import PocketBase from 'pocketbase'

// PocketBase instance — configure URL when backend is deployed
const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090')

export default pb

/**
 * Sync local data to PocketBase (future feature)
 * For MVP, data is stored locally in localStorage via Zustand persist.
 * This module provides the foundation for backend sync when PocketBase is deployed.
 */

export async function syncHousehold(household) {
  if (!pb.authStore.isValid) return null
  try {
    const existing = await pb.collection('households').getFirstListItem(`id="${household.id}"`)
    return await pb.collection('households').update(existing.id, household)
  } catch {
    return await pb.collection('households').create(household)
  }
}

export async function syncFixedCharges(householdId, charges) {
  if (!pb.authStore.isValid) return
  for (const charge of charges) {
    try {
      await pb.collection('fixed_charges').update(charge.id, { ...charge, household_id: householdId })
    } catch {
      await pb.collection('fixed_charges').create({ ...charge, household_id: householdId })
    }
  }
}
