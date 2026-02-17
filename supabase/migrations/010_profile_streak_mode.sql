ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS profile_streak_mode TEXT DEFAULT 'pinned'; -- 'pinned' or 'combined'
