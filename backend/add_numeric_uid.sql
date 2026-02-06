-- 添加数字 UID 字段的数据库迁移脚本
-- 在 Supabase SQL 编辑器中执行此脚本

-- 1. 创建序列
CREATE SEQUENCE IF NOT EXISTS user_uid_seq START 1;

-- 2. 添加 uid 列
ALTER TABLE users ADD COLUMN IF NOT EXISTS uid INTEGER UNIQUE;

-- 3. 为已有用户分配 UID
UPDATE users SET uid = nextval('user_uid_seq') WHERE uid IS NULL;

-- 4. 设置默认值，确保新用户自动获得 UID
ALTER TABLE users ALTER COLUMN uid SET DEFAULT nextval('user_uid_seq');

-- 5. 添加非空约束（在所有现有记录都有值之后）
-- ALTER TABLE users ALTER COLUMN uid SET NOT NULL;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid);
