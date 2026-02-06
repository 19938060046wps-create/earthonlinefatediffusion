from utils.supabase_client import get_supabase
import sys

def init_payment_table():
    supabase = get_supabase()
    
    # 支付订单表 SQL
    sql = """
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
    """
    
    # 创建索引
    idx_sql1 = "CREATE INDEX IF NOT EXISTS idx_payment_orders_amount_status ON payment_orders(final_amount, status);"
    idx_sql2 = "CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);"
    
    # 注意：我们的简化版 supabase_client 不支持执行裸 SQL
    # 我们只能通过 table().insert 等方法操作。
    # 这里我们假设用户可以运行此脚本来初始化，或者我尝试使用后端已有的 execute_sql.py
    print("请手动在 Supabase 控制台执行以下 SQL：")
    print(sql)
    print(idx_sql1)
    print(idx_sql2)

if __name__ == "__main__":
    init_payment_table()
