-- Create payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    razorpay_order_id VARCHAR(255) UNIQUE NOT NULL,
    razorpay_payment_id VARCHAR(255) UNIQUE NULL,
    razorpay_subscription_id VARCHAR(255) NULL,
    amount BIGINT NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) NOT NULL, -- e.g., 'created', 'paid', 'failed', 'refunded'
    payment_method VARCHAR(50) NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ NULL
);

-- Create indexes
CREATE INDEX idx_payments_user ON payments (user_id, created_at DESC);
CREATE INDEX idx_payments_razorpay_order ON payments (razorpay_order_id);
