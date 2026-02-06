"""
测试 Gemini API 连接
"""
import os
from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')
print(f'API Key loaded: {api_key[:20]}...' if api_key else 'API Key NOT loaded')

import google.generativeai as genai
genai.configure(api_key=api_key)

# 列出可用的模型
print('\nListing available models...')
try:
    models = []
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            models.append(m.name)
            print(f'  - {m.name}')
    print(f'\nTotal: {len(models)} models')
except Exception as e:
    print(f'Error listing models: {e}')

# 测试不同的模型
test_models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-3-flash-preview']
for model_name in test_models:
    print(f'\nTesting {model_name}...')
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content('Say hello in one word')
        print(f'  Success: {response.text[:50]}...')
    except Exception as e:
        print(f'  Error: {e}')
