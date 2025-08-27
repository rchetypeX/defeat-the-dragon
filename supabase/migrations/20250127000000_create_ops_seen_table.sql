-- Create ops_seen table for idempotency support
-- This table prevents duplicate operations and stores cached responses

CREATE TABLE IF NOT EXISTS ops_seen (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  op_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  operation_type TEXT NOT NULL,
  response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ops_seen_op_id ON ops_seen(op_id);
CREATE INDEX IF NOT EXISTS idx_ops_seen_user_id ON ops_seen(user_id);
CREATE INDEX IF NOT EXISTS idx_ops_seen_operation_type ON ops_seen(operation_type);
CREATE INDEX IF NOT EXISTS idx_ops_seen_created_at ON ops_seen(created_at);

-- Add RLS policies
ALTER TABLE ops_seen ENABLE ROW LEVEL SECURITY;

-- Users can only see their own operations
CREATE POLICY "Users can view their own operations" ON ops_seen
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can insert their own operations
CREATE POLICY "Users can insert their own operations" ON ops_seen
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own operations
CREATE POLICY "Users can update their own operations" ON ops_seen
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Clean up old operations (older than 30 days) - optional
CREATE OR REPLACE FUNCTION cleanup_old_ops()
RETURNS void AS $$
BEGIN
  DELETE FROM ops_seen 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old operations (optional)
-- This would need to be set up in your Supabase dashboard
-- SELECT cron.schedule('cleanup-ops', '0 2 * * *', 'SELECT cleanup_old_ops();');
