# Synapse

Synapse is an AI-powered, personalized learning platform that maps any subject or topic into a structured, interactive curriculum. The app generates custom modules, markdown lessons, and quiz checkpoints, supporting both cloud-based model inference (via Gemini) and 100% offline local inference (via Ollama).

---

## Key Features

* **AI-Guided Curriculum Generation**: Input any topic (e.g., *CSS Grid*, *Quantum Physics*) to generate a structured module and lesson outline.
* **Interactive Active Recall**: Embedded flashcards, quizzes, and checkpoints to assess and reinforce comprehension.
* **Dual Model Providers**: Supports Google Gemini (Cloud) and Ollama (Local) for course generation.
* **Robust Offline Fallback Cache**: Built-in **IndexedDB** caching system that protects against database connectivity errors, allowing full course history loading and lesson completions offline.
* **Automatic Data Synchronization**: Seamlessly reconciles and syncs offline-created courses and progress up to MongoDB Atlas once the client reconnects.
* **Gemini Connection Retry Strategy**: API routes feature exponential backoff retry parameters to handle rate limiting (429), server overloads (503), or socket timeouts.
* **Unified Developer Launcher**: A concurrent Python script that starts Ollama serve, pre-warms the local `gemma4:e4b` model, and boots up the Next.js dev server.

---

## Environment Variables (`.env`)

Create a `.env` file in the root directory (refer to [`.env.example`](file:///Users/adnanahmad/apps/projects/synapse/.env.example) for structure) and configure the following variables:

| Variable | Scope | Description | Example / Default |
|---|---|---|---|
| `GEMINI_API_KEY` | Server | Google Gemini API key. Obtained from [Google AI Studio](https://aistudio.google.com/). | `AIzaSy...` |
| `MONGODB_URI` | Server | MongoDB connection URI (supports Atlas cloud clusters or local mongo hosts). | `mongodb+srv://...` |
| `OLLAMA_HOST` | Server | Local HTTP endpoint for Ollama daemon. | `http://localhost:11434` |
| `OLLAMA_MODEL` | Server | Model tag name used on the server side for Ollama calls. | `gemma4:e4b` |
| `NEXT_PUBLIC_OLLAMA_HOST` | Client | Exposes default Ollama endpoint to the settings panel in browser. | `http://localhost:11434` |
| `NEXT_PUBLIC_OLLAMA_MODEL` | Client | Exposes default model recommendation to the settings panel in browser. | `gemma4:e4b` |

---

## Getting Started

### 1. Configure the environment
Copy the template to initialize your configuration:
```bash
cp .env.example .env
```
Open `.env` and fill in your `MONGODB_URI` and `GEMINI_API_KEY` (if using cloud generation).

### 2. Start the development environment

#### Option A: Local Ollama + Next.js (Offline Mode)
If you have [Ollama](https://ollama.com/) installed and want to run local AI model inference alongside the web server, open separate terminal windows and run:

1. **Start the local Ollama server**:
   ```bash
   ollama serve
   ```
2. **Download and run the required model** (to pre-load it into RAM):
   ```bash
   ollama run gemma4:e4b
   ```
3. **Start the Next.js development server**:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Option B: Gemini Cloud + Next.js (Online Mode)
If you are using Gemini Cloud and have an active MongoDB URI, start the development server directly:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Build and Testing

```bash
npm run build   # Compile optimized production bundle
npm run lint    # Run code standards and style checks
```
