-- Add nox_balance column to profiles table for digital currency tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nox_balance INTEGER DEFAULT 0;
