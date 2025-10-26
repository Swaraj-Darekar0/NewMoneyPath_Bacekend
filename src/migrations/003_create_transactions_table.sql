-- Create transaction_type ENUM
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

-- Create the transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
    type transaction_type NOT NULL,
    description TEXT,
    transaction_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    source VARCHAR(20) NOT NULL,
    source_identifier VARCHAR(255) NULL,
    encrypted_metadata TEXT NULL
);

-- Create a trigger to update the updated_at column on the transactions table
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_transactions_user_id ON transactions (user_id);
CREATE INDEX idx_transactions_type ON transactions (type);
CREATE INDEX idx_transactions_transaction_date ON transactions (transaction_date);
CREATE UNIQUE INDEX idx_transactions_source_identifier ON transactions (source_identifier) WHERE source_identifier IS NOT NULL;
