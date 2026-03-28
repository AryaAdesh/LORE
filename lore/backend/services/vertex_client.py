import os
import base64
import asyncio
from google import genai
from google.genai import types



async def generate_text(prompt: str, system: str = None) -> str:
    config = types.GenerateContentConfig(
        system_instruction=system,
        temperature=0.7,
        max_output_tokens=4096,
    )
    local_client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
    response = local_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=config
    )
    return response.text

async def generate_image(prompt: str) -> str:
    local_client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])

    def _try_generate(p: str):
        resp = local_client.models.generate_content(
            model="gemini-3.1-flash-image-preview",
            contents=p,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"]
            )
        )
        # Guard: blocked or refused responses have no content
        if not resp.candidates or not resp.candidates[0].content:
            return None
        for part in resp.candidates[0].content.parts:
            if part.inline_data and part.inline_data.mime_type.startswith("image"):
                data_bytes = part.inline_data.data
                try:
                    b64 = data_bytes.decode("utf-8")
                    if not b64.startswith(("/9j/", "iVBORw0K")):
                        b64 = base64.b64encode(data_bytes).decode("utf-8")
                except UnicodeDecodeError:
                    b64 = base64.b64encode(data_bytes).decode("utf-8")
                return f"data:{part.inline_data.mime_type};base64,{b64}"
        return None

    # First attempt
    result = _try_generate(prompt)
    if result:
        return result

    # Retry with a softened, safety-safe prompt
    safe_prompt = (
        "A beautiful, photorealistic educational illustration. "
        "Cinematic wide shot, dramatic lighting, rich colors. "
        "No people, no violence, no text. Scientific documentary style."
    )
    result = _try_generate(safe_prompt)
    if result:
        return result

    # Return None — chapter will render without image rather than crashing
    print("[WARN] generate_image: both attempts returned no image")
    return None


async def analyze_image_with_prompt(image_b64_uri: str, prompt: str, system: str = None) -> str:
    header, b64data = image_b64_uri.split(",", 1)
    image_bytes = base64.b64decode(b64data)
    mime_type = header.split(";", 1)[0].split(":", 1)[1]
    config = types.GenerateContentConfig(
        system_instruction=system,
        temperature=0.3,
        max_output_tokens=2048,
    )
    local_client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
    response = local_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            prompt
        ],
        config=config
    )
    return response.text

async def generate_video_async(prompt: str, chapter_id: str) -> str:
    try:
        from google.cloud import aiplatform
        project = os.environ.get("GOOGLE_CLOUD_PROJECT")
        location = "us-central1"
        aiplatform.init(project=project, location=location)
        endpoint = aiplatform.Endpoint(
            f"projects/{project}/locations/{location}/publishers/google/models/veo-3.0-generate-preview"
        )
        response = await asyncio.to_thread(
            endpoint.predict,
            instances=[{
                "prompt": prompt,
                "parameters": {"durationSeconds": 8, "aspectRatio": "16:9", "sampleCount": 1}
            }]
        )
        output_dir = "generated_videos"
        os.makedirs(output_dir, exist_ok=True)
        video_path = f"{output_dir}/{chapter_id}.mp4"
        video_bytes = base64.b64decode(response.predictions[0]["bytesBase64Encoded"])
        with open(video_path, "wb") as f:
            f.write(video_bytes)
        return f"/videos/{chapter_id}.mp4"
    except Exception as e:
        print(f"Veo generation failed for chapter {chapter_id}: {e}")
        return None
