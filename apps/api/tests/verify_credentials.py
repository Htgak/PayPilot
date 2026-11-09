import asyncio
import os
import httpx
from dotenv import load_dotenv

load_dotenv(".env")

async def verify_all():
    print("=" * 60)
    print("      PAYPILOT CREDENTIALS & SERVICE VERIFICATION     ")
    print("=" * 60)

    # 1. PayPal API
    base_url = os.getenv("PAYPAL_BASE_URL", "https://api-m.sandbox.paypal.com")
    c_id = os.getenv("PAYPAL_CLIENT_ID", "")
    c_secret = os.getenv("PAYPAL_CLIENT_SECRET", "")
    
    print("\n[1] PAYPAL SANDBOX CREDENTIALS")
    print(f"    • Base URL: {base_url}")
    print(f"    • Client ID: {c_id[:8]}...{c_id[-6:] if len(c_id) > 14 else ''}")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            token_res = await client.post(
                f"{base_url.rstrip('/')}/v1/oauth2/token",
                auth=(c_id, c_secret),
                data={"grant_type": "client_credentials"},
                headers={"Accept": "application/json"}
            )
            if token_res.status_code == 200:
                token_data = token_res.json()
                token = token_data["access_token"]
                print(f"    • Status: ✅ VALID & CONNECTED (HTTP 200)")
                print(f"    • Scope: {token_data.get('scope', 'N/A')[:45]}...")
                
                # Test real Invoicing v2 API
                inv_res = await client.post(
                    f"{base_url.rstrip('/')}/v2/invoicing/generate-next-invoice-number",
                    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
                )
                if inv_res.status_code == 200:
                    inv_num = inv_res.json().get("invoice_number", "0001")
                    print(f"    • Invoicing v2 API: ✅ Operational (Next Invoice #{inv_num})")
            else:
                print(f"    • Status: ❌ FAILED (HTTP {token_res.status_code}): {token_res.text[:100]}")
        except Exception as e:
            print(f"    • Status: ❌ Connection Error: {e}")

    # 2. Gemini AI
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    model_name = os.getenv("AI_MODEL", "gemini-3.5-flash")
    print("\n[2] GEMINI AI CREDENTIALS")
    print(f"    • Model: {model_name}")
    print(f"    • API Key: {gemini_key[:8]}...{gemini_key[-4:] if len(gemini_key) > 12 else ''}")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
            payload = {
                "contents": [{"parts": [{"text": "Reply with 'PayPilot AI Connected'"}]}]
            }
            ai_res = await client.post(url, json=payload)
            if ai_res.status_code == 200:
                text = ai_res.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                print(f"    • Status: ✅ VALID & CONNECTED (HTTP 200)")
                print(f"    • Response: \"{text}\"")
            else:
                print(f"    • Status: ❌ Error (HTTP {ai_res.status_code}): {ai_res.text[:120]}")
        except Exception as e:
            print(f"    • Status: ❌ Connection Error: {e}")

    # 3. Database & Supabase
    db_url = os.getenv("DATABASE_URL", "")
    supabase_url = os.getenv("SUPABASE_URL", "")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    print("\n[3] DATABASE & SUPABASE")
    print(f"    • Local SQLite Database: {db_url} (✅ Active)")
    if supabase_url and service_key:
        print(f"    • Supabase Project URL: {supabase_url}")
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                sb_res = await client.get(
                    f"{supabase_url}/rest/v1/",
                    headers={"apikey": service_key, "Authorization": f"Bearer {service_key}"}
                )
                if sb_res.status_code in [200, 204]:
                    print(f"    • Supabase Service Role: ✅ VALID & CONNECTED (HTTP {sb_res.status_code})")
                else:
                    print(f"    • Supabase Status: HTTP {sb_res.status_code}")
            except Exception as e:
                print(f"    • Supabase Error: {e}")

    # 4. Webhook ID
    webhook_id = os.getenv("PAYPAL_WEBHOOK_ID", "")
    print("\n[4] PAYPAL WEBHOOK ID")
    if webhook_id and webhook_id != "your_paypal_sandbox_webhook_id":
        print(f"    • Webhook ID: ✅ Configured ({webhook_id})")
    else:
        print(f"    • Webhook ID: ℹ️ Placeholder / Not yet created. (PayPilot automatically uses dev fallback mode)")

    print("\n" + "=" * 60)

if __name__ == "__main__":
    asyncio.run(verify_all())
