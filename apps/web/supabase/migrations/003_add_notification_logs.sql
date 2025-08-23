-- Add notification_logs table for tracking notification analytics
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'session_complete', 'session_failed', 'level_up', 'achievement', 
        'streak_milestone', 'boss_defeated', 'daily_reminder', 're_engagement'
    )),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    sent_count INTEGER DEFAULT 0 CHECK (sent_count >= 0),
    total_count INTEGER DEFAULT 0 CHECK (total_count >= 0),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_type ON notification_logs(user_id, type);

-- Add notification_preferences column to user_settings if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' 
        AND column_name = 'notification_preferences'
    ) THEN
        ALTER TABLE user_settings 
        ADD COLUMN notification_preferences JSONB DEFAULT '{
            "sessionComplete": true,
            "sessionFailed": true,
            "softShieldWarning": true,
            "levelUp": true,
            "achievements": true,
            "streakMilestones": true,
            "bossDefeated": true,
            "dailyReminders": true,
            "socialAchievements": true,
            "weeklyChallenges": true,
            "reEngagement": true
        }';
    END IF;
END $$;

-- Add RLS policies for notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notification logs
CREATE POLICY "Users can view own notification logs" ON notification_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert notification logs
CREATE POLICY "Service role can insert notification logs" ON notification_logs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Only service role can update notification logs
CREATE POLICY "Service role can update notification logs" ON notification_logs
    FOR UPDATE USING (auth.role() = 'service_role');

-- Only service role can delete notification logs
CREATE POLICY "Service role can delete notification logs" ON notification_logs
    FOR DELETE USING (auth.role() = 'service_role');

-- Function to clean up old notification logs (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_notification_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM notification_logs 
    WHERE sent_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old logs (if using pg_cron)
-- SELECT cron.schedule('cleanup-notification-logs', '0 2 * * *', 'SELECT cleanup_old_notification_logs();');

-- Function to get notification statistics for a user
CREATE OR REPLACE FUNCTION get_user_notification_stats(user_uuid UUID)
RETURNS TABLE (
    type TEXT,
    total_sent INTEGER,
    total_failed INTEGER,
    success_rate NUMERIC,
    last_sent TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        nl.type,
        SUM(nl.sent_count)::INTEGER as total_sent,
        SUM(nl.total_count - nl.sent_count)::INTEGER as total_failed,
        CASE 
            WHEN SUM(nl.total_count) > 0 
            THEN ROUND((SUM(nl.sent_count)::NUMERIC / SUM(nl.total_count)::NUMERIC) * 100, 2)
            ELSE 0 
        END as success_rate,
        MAX(nl.sent_at) as last_sent
    FROM notification_logs nl
    WHERE nl.user_id = user_uuid
    GROUP BY nl.type
    ORDER BY last_sent DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_notification_stats(UUID) TO authenticated;
