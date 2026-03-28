import os, asyncio
from google import genai

client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])

def sync_test():
    print("Testing sync...")
    res = client.models.generate_content(model="gemini-2.5-flash", contents="Hello")
    print(res.text)

async def aio_test():
    print("Testing aio...")
    res = await client.aio.models.generate_content(model="gemini-2.5-flash", contents="Hello")
    print(res.text)

try:
    sync_test()
except Exception as e:
    print(f"Sync failed: {e}")

try:
    asyncio.run(aio_test())
except Exception as e:
    print(f"Aio failed: {e}")
