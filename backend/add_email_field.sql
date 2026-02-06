-- 数据库迁移脚本：为 users 表添加 email 字段
-- 执行方式：在 Supabase SQL Editor 中运行此脚本

-- 1. 添加 email 字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;

-- 2. 创建邮箱索引以加速查询
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. 更新 phone 字段允许为空（支持纯邮箱注册）
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;

-- 注意事项：
-- - email 和 phone 至少需要有一个值
-- - 可以通过 CHECK 约束确保这一点（可选）
-- ALTER TABLE users ADD CONSTRAINT check_contact CHECK (phone IS NOT NULL OR email IS NOT NULL);
