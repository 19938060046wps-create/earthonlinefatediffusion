
import requests
import json

try:
    print("Testing Root...")
    r = requests.get("http://127.0.0.1:8000/")
    print(f"Root Status: {r.status_code}")
    print(r.json())

    print("\nTesting Health...")
    r = requests.get("http://127.0.0.1:8000/health")
    print(f"Health Status: {r.status_code}")
    print(r.json())
    
    # Check if we can reach auth endpoint (safe check)
    print("\nTesting Auth Root (Method Not Allowed expected)...")
    r = requests.get("http://127.0.0.1:8000/api/auth/login") # GET not allowed
    print(f"Auth Status: {r.status_code}") 

except Exception as e:
    print(f"Connection Failed: {e}")
