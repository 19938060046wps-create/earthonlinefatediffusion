import os
import sys
from dotenv import load_dotenv

# Add backend directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

# Explicitly load .env
env_path = os.path.join(backend_dir, ".env")
print(f"Loading .env from: {env_path}")
load_dotenv(env_path)

from utils.supabase_client import get_supabase, SUPABASE_URL

def delete_all_users():
    print(f"Using Supabase URL: {SUPABASE_URL}")
    supabase = get_supabase()
    
    print("Deleting all users...")
    
    # Supabase (PostgREST) requires a filter for DELETE.
    # We use neq to match all valid UUIDs (assuming no user has this nil UUID, which is standard)
    # Using a dummy UUID that is unlikely to exist.
    dummy_uuid = "00000000-0000-0000-0000-000000000000"
    
    response = supabase.table("users").delete().neq("id", dummy_uuid).execute()
    
    if response.error:
        print(f"Error deleting users: {response.error}")
    else:
        # response.data contains the deleted rows
        count = len(response.data) if response.data else 0
        print(f"Successfully deleted users. Count: {count}")

if __name__ == "__main__":
    delete_all_users()
