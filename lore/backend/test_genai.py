import os
import base64
from google import genai
client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
res = client.models.generate_content(
    model="gemini-3.1-flash-image-preview", contents="a red ball",
    config={"response_modalities": ["IMAGE"]}
)
data = res.candidates[0].content.parts[0].inline_data.data
print(type(data))
print(data[:40])
