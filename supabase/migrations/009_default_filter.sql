
ALTER TABLE user_settings
ADD COLUMN default_filter_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;
