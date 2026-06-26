-- Presence Room Tracking Migration
-- Add current_room column to user_presence table to track active chat room participation
ALTER TABLE user_presence ADD COLUMN IF NOT EXISTS current_room TEXT;
