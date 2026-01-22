import os
import requests
from datetime import datetime, timedelta
from supabase import create_client

# Load credentials from environment
URL = "https://n8n.codegraph.cc/webhook/Birdfeeder-financials-square-data"
# Use .strip() to remove hidden newlines or spaces
WEBHOOK_KEY = os.getenv("WEBHOOK_KEY").strip()
WEBHOOK_VALUE = os.getenv("WEBHOOK_VALUE").strip()

HEADERS = {WEBHOOK_KEY: WEBHOOK_VALUE}

# 1. Initialize Supabase
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def sync_yesterday():
    # Calculate yesterday's date
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    
    # 2. Call Webhook
    response = requests.get(f"{URL}?date={yesterday}", headers=HEADERS)
    response.raise_for_status()
    data = response.json()

    # 3. Map Fields to your Database Schema
    # Mapping: Webhook -> Database Column
    payload = {
        "date": data["date"],
        "revenue": data["net_revenue"],      # Map net_revenue to revenue
        "cogs": data["total_cogs"],          # Map total_cogs to cogs
        "comps": data["comps_discounts"],    # Map comps_discounts to comps
        "processing": data["processing_fees"],# Map processing_fees to processing
        "net_income": data["net_income"]
    }

    # 4. Upsert to Supabase (Updates if date exists, Inserts if not)
    supabase.table("daily_kpis").upsert(payload).execute()
    print(f"Successfully synced data for {yesterday}")

if __name__ == "__main__":
    sync_yesterday()
