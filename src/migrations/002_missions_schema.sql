-- Create missions table
CREATE TABLE missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    target_amount BIGINT NOT NULL,
    duration_days INTEGER NOT NULL,
    priority VARCHAR(20) NOT NULL,
    amount_saved BIGINT DEFAULT 0,
    daily_target BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ NULL,
    order_index INTEGER DEFAULT 0
);

-- Create indexes
CREATE INDEX idx_missions_user ON missions (user_id, status);
CREATE INDEX idx_missions_priority ON missions (user_id, priority, order_index);

-- Create trigger for updated_at
CREATE TRIGGER update_missions_updated_at
BEFORE UPDATE ON missions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
