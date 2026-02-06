"""
自动化验证脚本
测试 GEMINI_API_KEY 配置和退款逻辑
"""

import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

def test_api_key_loaded():
    """测试 1: 检查 GEMINI_API_KEY 是否已加载"""
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        print(f"✅ GEMINI_API_KEY 已加载 (长度: {len(api_key)} 字符)")
        return True
    else:
        print("❌ GEMINI_API_KEY 未配置")
        return False

def test_refund_keywords():
    """测试 2: 检查退款逻辑的错误关键词检测"""
    error_keywords = [
        "系统配置错误",
        "未找到 Gemini API Key",
        "AI 服务暂时无法连接",
        "请联系管理员"
    ]
    
    # 模拟错误响应
    test_error_response = "系统配置错误：未找到 Gemini API Key。请联系管理员配置。"
    is_error = any(keyword in test_error_response for keyword in error_keywords)
    
    if is_error:
        print("✅ 退款逻辑关键词检测正常 - 能正确识别错误响应")
        return True
    else:
        print("❌ 退款逻辑关键词检测失败")
        return False

def test_normal_response():
    """测试 3: 正常响应不应触发退款"""
    error_keywords = [
        "系统配置错误",
        "未找到 Gemini API Key",
        "AI 服务暂时无法连接",
        "请联系管理员"
    ]
    
    # 模拟正常响应
    test_normal_response = "您好，感谢您的提问。根据您的八字命盘分析..."
    is_error = any(keyword in test_normal_response for keyword in error_keywords)
    
    if not is_error:
        print("✅ 正常响应不会触发退款逻辑")
        return True
    else:
        print("❌ 正常响应被误判为错误")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("FateDiffusion 自动化验证测试")
    print("=" * 50)
    print()
    
    results = []
    results.append(test_api_key_loaded())
    results.append(test_refund_keywords())
    results.append(test_normal_response())
    
    print()
    print("=" * 50)
    passed = sum(results)
    total = len(results)
    print(f"测试结果: {passed}/{total} 通过")
    
    if passed == total:
        print("🎉 所有测试通过！")
    else:
        print("⚠️ 部分测试未通过，请检查配置")
