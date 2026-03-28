# LORE — Live, Orchestrated, Reactive Encyclopaedia

**Experience Knowledge. Don't Just Read It.**

### 👥 The Team
Created with ❤️ at the NYU Google DSC Gemini Hackathon by:
*   **Ritvik Vasantha Kumar** — [rv2459@nyu.edu](mailto:rv2459@nyu.edu) 
*   **Arya Adesh** — [aa11931@nyu.edu](mailto:aa11931@nyu.edu)

---

LORE is a next-generation **multimodal story engine** built for the NYU Google DSC Gemini Hackathon. Stepping out of the traditional "text box" paradigm, LORE transforms complex topics into cinematic, interactive narrative journeys using an autonomous multi-agent architecture powered by Google Cloud and Gemini.

---

## 🎙️ The Vision: Beyond the Textbox

Most AI interfaces are flat—a question followed by a static wall of text. **LORE is an experience that hears, speaks, sees, and creates.**

By leveraging Gemini's native interleaved output capabilities, LORE weaves together:
- **Cinematic Narration**: Real-time voiceovers with word-level synchronization and highlighting.
- **Dynamic Visuals**: Beautiful scene illustrations generated via **Nano Banana**  tailored to the narrative arc.
- **Interactive Waypoints**: Inspired by the Minerva project, LORE identifies key concepts in every scene and generates interactive "drill-down" branches on the fly.
- **Perspective Shifting**: Instantly flip the narrative frame mid-story—from a "Greek Myth" to a "Socratic Dialogue"—and watch the entire visual and auditory world regenerate.

---

## 🛠️ High-Level Architecture

LORE uses a sophisticated **Agent-to-Agent (A2A)** orchestration pattern to ensure high-quality, grounded storytelling:

1.  **The Brain (Orchestrator)**: **Gemini 2.5 Pro** via the **Agent Development Kit (ADK)** plans a multi-act story arc, extracting core concepts and managing the narrative flow.
2.  **The Artist (Visuals)**: **Nano Banana** generates consistent, high-fidelity scene illustrations per chapter.
3.  **The Voice (Live API)**: **Gemini Live API** handles real-time voice I/O, allowing users to interrupt the narration for deep-dive questions without losing their place in the story.
4.  **The Exporter**: A custom engine that converts interactive stories into **Google Slides** and **Google Docs** for real-world educational portability.

### Tech Stack
- **Backend**: Python (FastAPI), Google GenAI SDK, ADK.
- **Frontend**: React (Vite), TailwindCSS, Framer Motion.
- **Deployment**: Google Cloud / Vertex AI.

---

## 🚀 Key Features

- **Fluid Interleaved Output**: Seamless blending of text, images, and narration in a single, timed stream.
- **Interactive Branched Narratives**: Don't just follow the path—double-click a concept to "drill down" into a sub-story generated live.
- **Real-Time Synthesis**: High-speed generation ensures the transition from prompt to story feels instantaneous.
- **Consistent Art Direction**: Uses specific style-conditioning to ensure visual coherence across all story chapters.

---

> *"Deep down, we are all storytellers. LORE just gives us the engine to make those stories come alive."*
