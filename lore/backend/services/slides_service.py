import os
import io
import base64
import asyncio
from pptx import Presentation
from pptx.util import Inches, Pt

async def export_to_slides(story) -> str:
    # Bypassing Google OAuth setup in favor of native .pptx generation downloads
    return await export_to_slides_local(story)

async def export_to_slides_local(story) -> str:
    slides_html = f"""<!DOCTYPE html>
<html>
<head>
<title>LORE: {story.topic}</title>
<style>
  body {{ margin: 0; background: #0a0a0a; font-family: 'Google Sans', sans-serif; overflow: hidden; }}
  .slide {{ width: 100vw; height: 100vh; position: relative; display: none; }}
  .slide.active {{ display: block; }}
  .slide img {{ width: 100%; height: 100%; object-fit: cover; }}
  .overlay {{ position: absolute; bottom: 0; left: 0; right: 0; padding: 48px;
              background: linear-gradient(transparent, rgba(0,0,0,0.9)); color: white; }}
  .chapter-num {{ font-size: 13px; opacity: 0.6; margin-bottom: 8px; letter-spacing: 0.1em; text-transform: uppercase; }}
  .chapter-title {{ font-size: 36px; font-weight: 600; margin-bottom: 16px; }}
  .narration {{ font-size: 17px; line-height: 1.7; opacity: 0.85; max-width: 760px; }}
  .nav {{ position: fixed; bottom: 28px; right: 28px; display: flex; gap: 10px; z-index: 10; }}
  .nav button {{ background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3);
                 color: white; padding: 10px 22px; border-radius: 8px; cursor: pointer;
                 font-size: 14px; backdrop-filter: blur(8px); }}
  .nav button:hover {{ background: rgba(255,255,255,0.25); }}
  .progress {{ position: fixed; top: 0; left: 0; height: 2px; background: #7c6af7;
               transition: width 0.4s ease; z-index: 10; }}
</style>
</head>
<body>
<div class="progress" id="progress"></div>
"""
    for i, chapter in enumerate(story.chapters):
        active = "active" if i == 0 else ""
        slides_html += f"""
<div class="slide {active}" id="slide-{i}">
  <img src="{chapter.image_url or ''}" alt="{chapter.title}">
  <div class="overlay">
    <div class="chapter-num">Chapter {chapter.index + 1} of {len(story.chapters)}</div>
    <div class="chapter-title">{chapter.title}</div>
    <div class="narration">{chapter.narration_script}</div>
  </div>
</div>"""

    slides_html += f"""
<div class="nav">
  <button onclick="prevSlide()">← Prev</button>
  <button onclick="nextSlide()">Next →</button>
</div>
<script>
  let current = 0;
  const slides = document.querySelectorAll('.slide');
  const progress = document.getElementById('progress');
  function show(n) {{
    slides.forEach(s => s.classList.remove('active'));
    current = (n + slides.length) % slides.length;
    slides[current].classList.add('active');
    progress.style.width = ((current + 1) / slides.length * 100) + '%';
  }}
  function nextSlide() {{ show(current + 1); }}
  function prevSlide() {{ show(current - 1); }}
  document.addEventListener('keydown', e => {{
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextSlide();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevSlide();
  }});
  show(0);
</script>
</body></html>"""

    os.makedirs("exports", exist_ok=True)
    path = f"exports/lore_slides_{story.id}.html"
    with open(path, "w") as f:
        f.write(slides_html)
    return f"/exports/{story.id}/slides"

