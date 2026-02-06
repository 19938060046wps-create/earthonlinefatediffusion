import traceback
import sys
import os

# Add the current directory to path
sys.path.append(os.getcwd())

try:
    print("Attempting to import main.py...")
    from main import app
    print("Import Success!")
except Exception as e:
    print("\n--- ERROR TRACEBACK ---")
    traceback.print_exc()
    print("------------------------\n")
