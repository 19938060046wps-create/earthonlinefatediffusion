import sys
import os
from dotenv import load_dotenv

# Ensure backend root is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.supabase_client import get_supabase

def check_table(table_name):
    supabase = get_supabase()
    print(f"Checking table: {table_name}")
    try:
        # Fetch just 1 row to check if table is empty
        res = supabase.table(table_name).select("*").limit(1).execute()
        
        if len(res.data) > 0:
            print(f"WARNING: Table '{table_name}' is NOT empty. Found data.")
            return 1 # Just return non-zero
        else:
            print(f"Table '{table_name}' is empty.")
            return 0
    except Exception as e:
        print(f"Error checking table '{table_name}': {e}")
        # If it's a "relation does not exist" error, then it's effectively empty/cleared
        if "relation" in str(e) and "does not exist" in str(e):
             return 0
        return None

def main():
    load_dotenv()
    
    tables = [
        "users",
        "history_items",
        "chat_messages",
        "chat_sessions", 
        "friend_messages",
        "posts",
        "referrals"
    ]
    
    all_cleared = True
    print("Starting verification of user tables...\n")
    
    for table in tables:
        count = check_table(table)
        if count is not None and count > 0:
            all_cleared = False
        elif count is None:
             # Error occurred, assume not safe to say cleared unless we know why
             # But if error is generic, we flag it.
             print(f"WARNING: Could not verify table '{table}' due to error.")
             all_cleared = False

    if all_cleared:
        print("\nSUCCESS: All checked user-related tables appear to be empty.")
    else:
        print("\nFAILURE: Some tables still contain data or could not be verified.")

if __name__ == "__main__":
    main()
