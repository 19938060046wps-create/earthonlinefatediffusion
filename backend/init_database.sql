-- FateDiffusion Supabase 数据库初始化脚本
-- 在 Supabase SQL 编辑器中执行此脚本

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    username VARCHAR(100) DEFAULT 'User_' || floor(random() * 100000)::text,
    avatar_url TEXT,
    balance INTEGER DEFAULT 88,
    has_agreed_privacy BOOLEAN DEFAULT FALSE,
    theme VARCHAR(10) DEFAULT 'light',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 历史记录表
CREATE TABLE IF NOT EXISTS history_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200),
    t_level VARCHAR(10),
    birth_year INTEGER,
    birth_month INTEGER,
    birth_day INTEGER,
    birth_hour INTEGER,
    gender VARCHAR(10),
    name VARCHAR(100),
    chart_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 对话消息表
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    history_id UUID REFERENCES history_items(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_user BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 好友聊天会话表
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
    last_message TEXT,
    unread INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 好友消息表
CREATE TABLE IF NOT EXISTS friend_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 社区帖子表
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(300),
    content TEXT,
    tags TEXT[],
    likes INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_history_user_id ON history_items(user_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON history_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_history_id ON chat_messages(history_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- 启用 Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE history_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- RLS 策略：允许通过服务端访问（使用 service role key）
-- 注意：这里使用 anon key 的简化策略，生产环境应使用更严格的策略

-- 用户表策略
DROP POLICY IF EXISTS "Allow all for users" ON users;
CREATE POLICY "Allow all for users" ON users FOR ALL USING (true);

-- 历史记录表策略
DROP POLICY IF EXISTS "Allow all for history_items" ON history_items;
CREATE POLICY "Allow all for history_items" ON history_items FOR ALL USING (true);

-- 对话消息表策略
DROP POLICY IF EXISTS "Allow all for chat_messages" ON chat_messages;
CREATE POLICY "Allow all for chat_messages" ON chat_messages FOR ALL USING (true);

-- 聊天会话表策略
DROP POLICY IF EXISTS "Allow all for chat_sessions" ON chat_sessions;
CREATE POLICY "Allow all for chat_sessions" ON chat_sessions FOR ALL USING (true);

-- 好友消息表策略
DROP POLICY IF EXISTS "Allow all for friend_messages" ON friend_messages;
CREATE POLICY "Allow all for friend_messages" ON friend_messages FOR ALL USING (true);

-- 帖子表策略
DROP POLICY IF EXISTS "Allow all for posts" ON posts;
CREATE POLICY "Allow all for posts" ON posts FOR ALL USING (true);

-- 支付订单表
CREATE TABLE IF NOT EXISTS payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    base_amount NUMERIC NOT NULL,
    final_amount NUMERIC NOT NULL,
    points INTEGER NOT NULL,
    status SMALLINT DEFAULT 0, -- 0: 待支付, 1: 已支付, 2: 已过期
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + interval '5 minutes')
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_amount_status ON payment_orders(final_amount, status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);

ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for payment_orders" ON payment_orders FOR ALL USING (true);
