"""
FateDiffusion 后端服务入口
基于 FastAPI 的 RESTful API 服务
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# 加载环境变量
# 加载环境变量
# 显式指定 backend/.env 路径，防止在根目录运行 python backend/main.py 时找不到配置
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# 导入 API 路由
from api.auth import router as auth_router
from api.users import router as users_router
from api.history import router as history_router
from api.chat import router as chat_router
from api.pay import router as pay_router

# 创建 FastAPI 应用
app = FastAPI(
    title="FateDiffusion API",
    description="命理应用后端 API 服务",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 配置
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "*"  # 允许局域网访问
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", summary="根路径")
async def root():
    """
    API 服务根路径
    """
    return {
        "name": "FateDiffusion API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health", summary="健康检查")
async def health_check():
    """
    服务健康检查接口
    """
    return {"status": "healthy"}


# 注册 API 路由
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(history_router)
app.include_router(chat_router)
app.include_router(chat_router)
app.include_router(pay_router)


# 挂载静态文件目录 (头像存储)
from fastapi.staticfiles import StaticFiles
os.makedirs("uploads/avatars", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
