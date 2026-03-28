import asyncio
import json
import os
from fastapi import WebSocket, WebSocketDisconnect
from google import genai
from google.genai import types
from prompts.templates import LIVE_SYSTEM, build_live_context, PERSONA_VOICES

client = genai.Client(
    api_key=os.environ["GOOGLE_API_KEY"],
    http_options={"api_version": "v1alpha"}
)


async def handle_live_session(websocket: WebSocket, story_id: str, chapter_id: str, story_store: dict, persona: str = "documentary"):
    await websocket.accept()

    story = story_store.get(story_id)
    if not story:
        await websocket.send_json({"type": "error", "message": "Story not found"})
        await websocket.close()
        return

    chapter = next((c for c in story.chapters if c.id == chapter_id), None)
    if not chapter:
        await websocket.send_json({"type": "error", "message": "Chapter not found"})
        await websocket.close()
        return

    context = build_live_context(chapter.model_dump(), story.topic, persona)
    full_system = LIVE_SYSTEM + "\n\n" + context
    voice_name = PERSONA_VOICES.get(persona, "Charon")

    # Bug 4 fix: use typed LiveConnectConfig — plain dict silently drops speech_config
    config = types.LiveConnectConfig(
        response_modalities=["AUDIO"],
        system_instruction=types.Content(
            parts=[types.Part(text=full_system)],
            role="user"
        ),
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice_name)
            )
        )
    )

    try:
        async with client.aio.live.connect(
            model="gemini-2.0-flash-live-001",
            config=config
        ) as session:

            # Immediately trigger narration — send the script as a text turn
            await session.send(
                input={"text": chapter.narration_script},
                end_of_turn=True
            )

            # Stream all audio + transcript back to the frontend
            async def stream_to_client():
                try:
                    async for response in session.receive():
                        if response.data:
                            await websocket.send_bytes(response.data)
                        if hasattr(response, 'server_content') and response.server_content:
                            sc = response.server_content
                            if hasattr(sc, 'model_turn') and sc.model_turn:
                                for part in sc.model_turn.parts:
                                    if hasattr(part, 'inline_data') and part.inline_data:
                                        await websocket.send_bytes(part.inline_data.data)
                                    if hasattr(part, 'text') and part.text:
                                        await websocket.send_json({
                                            "type": "transcript",
                                            "text": part.text
                                        })
                        if hasattr(response, 'text') and response.text:
                            await websocket.send_json({
                                "type": "transcript",
                                "text": response.text
                            })
                except WebSocketDisconnect:
                    pass

            await stream_to_client()

    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
            await websocket.close()
        except:
            pass
