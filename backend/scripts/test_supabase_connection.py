import sys
import os

# Add parent directory to path so we can import from utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.supabase_client import get_supabase

def test_connection():
    print("Testing Supabase connection...")
    try:
        supabase = get_supabase()
        print("Client initialized.")
        
        response = supabase.table("users").select("id").limit(1).execute()
        
        if response.error:
            print(f"Error querying Supabase: {response.error}")
            return False
            
        print("Successfully connected to Supabase!")
        print(f"Data received: {response.data}")
        return True
        
    except Exception as e:
        print(f"Exception during connection test: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
