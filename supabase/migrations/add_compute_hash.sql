-- Add compute_hash column to employees table
-- Run this in your Supabase SQL Editor

ALTER TABLE employees
ADD COLUMN IF NOT EXISTS compute_hash TEXT DEFAULT NULL;

COMMENT ON COLUMN employees.compute_hash IS 'keccak256 hash of the Arcium compute batch, attested on-chain via ArciumRegistry contract';
