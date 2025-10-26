-- Create the users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    is_premium BOOLEAN DEFAULT FALSE,
    premium_expires_at TIMESTAMPTZ NULL,
    trial_started_at TIMESTAMPTZ NULL,
    daily_expenses BIGINT NOT NULL,
    average_monthly_income BIGINT NOT NULL,
    todays_saving_target BIGINT DEFAULT 0,
    gain_today BIGINT DEFAULT 0,
    spend_today BIGINT DEFAULT 0,
    buffer_status BIGINT DEFAULT 0,
    total_available BIGINT DEFAULT 0,
    last_discipline_update TIMESTAMPTZ,
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata'
);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function before UPDATE on the users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_premium ON users (is_premium, premium_expires_at);
CREATE INDEX idx_users_deleted ON users (deleted_at);
