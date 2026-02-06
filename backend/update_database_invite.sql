-- 添加邀请码字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_code VARCHAR(20) UNIQUE;

-- 创建邀请关系表
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referee_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- 确保用户不能邀请自己（虽然应用层也会检查）
    CONSTRAINT no_self_referral CHECK (referrer_id != referee_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);

-- 启用 RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "Allow all for referrals" ON referrals FOR ALL USING (true);
