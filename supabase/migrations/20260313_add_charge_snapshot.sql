-- Add charge snapshot JSONB column to monthly_entries
-- Stores the computed ChargeDetail[] + summary for each month
ALTER TABLE monthly_entries ADD COLUMN IF NOT EXISTS charge_snapshot JSONB DEFAULT NULL;
ALTER TABLE monthly_entries ADD COLUMN IF NOT EXISTS snapshotted_at TIMESTAMPTZ DEFAULT NULL;
