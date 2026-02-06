"""
Supabase 客户端配置模块
使用 httpx 直接调用 Supabase REST API，避免依赖需要编译的库
"""

import os
from typing import Optional, Any
import httpx
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 从环境变量读取配置
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("缺少 Supabase 配置，请检查环境变量 SUPABASE_URL 和 SUPABASE_KEY")


class SupabaseResponse:
    """Supabase API 响应封装"""
    
    def __init__(self, data: list, error: Optional[dict] = None):
        self.data = data
        self.error = error


class SupabaseQueryBuilder:
    """Supabase 查询构建器，模拟官方库的链式调用接口"""
    
    def __init__(self, client: 'SupabaseClient', table: str):
        self._client = client
        self._table = table
        self._method = "GET"
        self._body: Optional[dict] = None
        self._filters: list[str] = []
        self._select_columns = "*"
        self._order_by: Optional[str] = None
        self._limit_count: Optional[int] = None
    
    def select(self, columns: str = "*") -> 'SupabaseQueryBuilder':
        """选择列"""
        self._select_columns = columns
        return self
    
    def insert(self, data: dict) -> 'SupabaseQueryBuilder':
        """插入数据"""
        self._method = "POST"
        self._body = data
        return self
    
    def update(self, data: dict) -> 'SupabaseQueryBuilder':
        """更新数据"""
        self._method = "PATCH"
        self._body = data
        return self
    
    def delete(self) -> 'SupabaseQueryBuilder':
        """删除数据"""
        self._method = "DELETE"
        return self
    
    def eq(self, column: str, value: Any) -> 'SupabaseQueryBuilder':
        """等于条件"""
        self._filters.append(f"{column}=eq.{value}")
        return self
    
    def neq(self, column: str, value: Any) -> 'SupabaseQueryBuilder':
        """不等于条件"""
        self._filters.append(f"{column}=neq.{value}")
        return self
    
    def order(self, column: str, desc: bool = False) -> 'SupabaseQueryBuilder':
        """排序"""
        direction = "desc" if desc else "asc"
        self._order_by = f"{column}.{direction}"
        return self
    
    def limit(self, count: int) -> 'SupabaseQueryBuilder':
        """限制返回数量"""
        self._limit_count = count
        return self
    
    def execute(self) -> SupabaseResponse:
        """执行查询"""
        url = f"{self._client._url}/rest/v1/{self._table}"
        
        # 构建查询参数
        params: dict[str, str] = {}
        
        if self._method == "GET":
            params["select"] = self._select_columns
        
        # 添加过滤条件
        for filter_str in self._filters:
            key, value = filter_str.split("=", 1)
            params[key] = value
        
        if self._order_by:
            params["order"] = self._order_by
        
        if self._limit_count:
            params["limit"] = str(self._limit_count)
        
        # 构建请求头
        headers = {
            **self._client._headers,
            "Prefer": "return=representation"
        }
        
        # 发送请求
        with httpx.Client() as client:
            if self._method == "GET":
                response = client.get(url, params=params, headers=headers)
            elif self._method == "POST":
                response = client.post(url, params=params, headers=headers, json=self._body)
            elif self._method == "PATCH":
                response = client.patch(url, params=params, headers=headers, json=self._body)
            elif self._method == "DELETE":
                response = client.delete(url, params=params, headers=headers)
            else:
                raise ValueError(f"不支持的 HTTP 方法: {self._method}")
        
        # 解析响应
        if response.status_code >= 400:
            error_data = {"message": response.text, "code": response.status_code}
            return SupabaseResponse(data=[], error=error_data)
        
        try:
            data = response.json()
            if isinstance(data, list):
                return SupabaseResponse(data=data)
            else:
                return SupabaseResponse(data=[data] if data else [])
        except Exception:
            return SupabaseResponse(data=[])


class SupabaseClient:
    """
    简化版 Supabase 客户端
    使用 httpx 直接调用 REST API
    """
    
    def __init__(self, url: str, key: str):
        self._url = url.rstrip("/")
        self._key = key
        self._headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
    
    def table(self, table_name: str) -> SupabaseQueryBuilder:
        """
        获取表操作构建器
        
        :param table_name: 表名
        :return: 查询构建器
        """
        return SupabaseQueryBuilder(self, table_name)


# 创建 Supabase 客户端单例
supabase = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)


def get_supabase() -> SupabaseClient:
    """
    获取 Supabase 客户端实例
    """
    return supabase
