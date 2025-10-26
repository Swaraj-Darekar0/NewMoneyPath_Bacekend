
ALTER TABLE users
ADD COLUMN enable_analytics BOOLEAN DEFAULT TRUE,
ADD COLUMN enable_transaction_tracking BOOLEAN DEFAULT TRUE,
ADD COLUMN data_retention_period INTEGER DEFAULT 365;
