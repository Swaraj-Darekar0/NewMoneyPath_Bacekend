-- Create audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NULL,
    entity_id UUID NULL,
    old_values JSONB NULL,
    new_values JSONB NULL,
    ip_address INET NULL,
    user_agent TEXT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_audit_logs_user ON audit_logs (user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs (action, timestamp DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
