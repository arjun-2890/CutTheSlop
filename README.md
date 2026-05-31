# ⚡ CutTheSlop — AI Content Quality Auditing & Distillation Engine

> **"Don’t read slop. Catch it."** > An advanced Chrome Extension built for the 72h AI Content Quality Hackathon to make low-effort, bloated web content instantly visible and distill any webpage into high-density, factual knowledge.

---

## 📺 Live Demo Video
[👉 CLICK HERE TO WATCH THE 2-MINUTE DEMO VIDEO 👈](https://www.youtube.com/watch?v=P58eJjhT9DU)

---

## 🎯 The Challenge & Solution

The internet is currently saturated with low-effort, SEO-bloated, and unchecked AI-generated "slop" that obscures real information. **CutTheSlop** fixes this by switching the paradigm from *"Is this AI?"* to **"Is this actually useful?"**. 

With a dual-engine processing model, it strips away ads, navigation layers, cookie prompts, and repetitive filler text, instantly rebuilding the webpage into a clean, distraction-free reader interface complete with granular content quality scoring.

---

## 🚀 Core Features & Innovation

* **Dual-Engine Architecture:** Combines a local static dictionary of **55+ heuristic slop patterns** with the contextual intelligence of **Google Gemini 3.5 Flash** for complete content distillation.
* **Real-Time Slop Heatmap (The Catch Engine):** Toggle seamlessly between the clean view and the original text view. In the original view, a live sentence-level analytical engine highlights low-effort phrases in varying neon severities (Plasma Red, Amber, Spark Yellow).
* **Metrics Telemetry Grid:** Dynamically counts and displays key performance metrics:
    * **Slop Filtered %** (Total noise reduction gauge)
    * **Useless Words Cut** (Animate counter for stripped tokens)
    * **Reading Time Saved** (Minutes shaved off vs. unfiltered original)
* **Advanced Quality Matrix:** Calculates and updates signal indexes for **SEO Over-Optimization**, **AI Content Loop Redundancy**, and **Factual Core Density**.
* **Exportable Audits:** One-click **"Download Report"** functionality that generates clean, raw structural data as a CSV file for compliance or archiving.
* **Premium UX/UI:** Fully reactive, modern dark/light mode interface utilizing high-end typography, smooth micro-interactions, and a custom scrolling progress engine.

---

## 🛠️ Technical Execution & Stack

* **Frontend Architecture:** Native Web Components, CSS Variables (Custom Neon Cyberpunk Theme Mapping), Asynchronous DOM Manipulation.
* **Extension Infrastructure:** Manifest V3 API (Programmatic Execution Scripting, ActiveTab isolation, Background Service Workers).
* **Storage Framework:** Secure persistence via `chrome.storage.local` to securely buffer and load session stats and user configuration data.
* **LLM Pipeline:** Secure runtime API configuration accessing Google Gemini 3.5 Flash, coupled with exponential backoff retry policies for rate-limit protection.

---

## 💻 Local Installation & Setup

To run this project locally during the judging window, follow these simple steps:

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/arjun-2890/CutTheSlop.git](https://github.com/arjun-2890/CutTheSlop.git)
    ```
2.  **Open Chrome Extensions:**
    * Open Google Chrome and navigate to `chrome.config://extensions/` (or `chrome://extensions/`).
    * Enable **Developer mode** toggle in the top-right corner.
3.  **Load the Extension:**
    * Click on **Load unpacked** in the top-left corner.
    * Select the root directory folder containing the project files (where the `manifest.json` is located).
4.  **Configure API Key:**
    * Click on the extension icon in your toolbar, enter your Gemini API Key in the config input box, and press **Save**.
    * Navigate to any cluttered webpage and press **Clean Page**!

---

## ⚖️ Hackathon Evaluation Alignment

* **Detection Accuracy (30%):** Leverages a robust local lexicon map matching 55 foundational patterns alongside structural document tree extraction.
* **Practical Usefulness (25%):** Immediately solves info-obesity by reclaiming minutes of reading time per article, providing clean text export and copy options.
* **Technical Execution (20%):** Zero dependencies. Built purely with Vanilla JavaScript using advanced Chrome cross-script messaging loops and native dynamic CSV rendering.

---
Developed solo with passion for the AI Content Quality Challenge (May 2026).