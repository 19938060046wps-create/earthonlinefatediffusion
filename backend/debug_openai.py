import sys
import os

print(f"Python path: {sys.path}")
try:
    import openai
    print(f"OpenAI package path: {openai.__path__}")
    print(f"OpenAI version: {getattr(openai, '__version__', 'unknown')}")
    from openai import OpenAI
    print("Successfully imported OpenAI class")
except Exception as e:
    print(f"Error during import: {e}")
    import traceback
    traceback.print_exc()
