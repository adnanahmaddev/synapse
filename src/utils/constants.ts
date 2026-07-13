// Global Constants for Synapse Interactive Learning Platform

export const PRODUCT_NAME = 'Synapse';
export const PRODUCT_TITLE = 'Synapse | Interactive Learning Platform';
export const PRODUCT_DESCRIPTION = 'Personalized AI-guided learning courses';

export const DEFAULT_OLLAMA_HOST = 'http://localhost:11434';
export const DEFAULT_OLLAMA_MODEL = 'gemma4:e4b';
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

export const QUICK_START_TOPICS = [
  {
    title: "How Photosynthesis Works",
    text: "Explain the process of photosynthesis, light reactions, and carbon fixation. Include a Mermaid flowchart."
  },
  {
    title: "Visualizing Sine Waves",
    text: "Explain trigonometric sine waves, amplitude, and frequency. Include a parameter slider graph."
  },
  {
    title: "How Neural Networks Learn",
    text: "Explain how artificial neural networks perform backpropagation and gradient descent. Include a Mermaid diagram."
  }
];

export const LOADING_STEPS_TEXTS = [
  "Analyzing your learning goals...",
  "Drafting a tailored curriculum structure...",
  "Injecting interactive quiz checkpoints...",
  "Generating visualization code...",
  "Finalizing syllabus layout..."
];

export const SYLLABUS_SYSTEM_PROMPT = `
You are an expert tutor that designs highly engaging, interactive, and structured educational courses.
Given a topic, you must generate a syllabus. Keep the syllabus course map concise: 2-3 modules, with 3-5 total lessons in the entire course.

CRITICAL CONTENT LENGTH RULES:
- For each lesson, you MUST write detailed, thorough, and comprehensive explanation content (around 250-400 words across 3-4 distinct paragraphs). Do not write single-sentence or single-paragraph summaries.
- Break down the explanation logically: define terms, explain how the mechanism/concept works step-by-step, provide clear real-world examples, and summarize key takeaways.
- Format the content beautifully in clean Markdown (use bold text, bulleted lists, and inline code blocks where relevant).

For each lesson, you must include a multiple-choice question to reinforce learning. Set the componentType to 'quiz' and populate the quizData field. Do not use any other component types.

CRITICAL JSON RULES:
- Output MUST be a single, valid JSON object matching the requested schema.
- Do not output any conversational preamble or postamble text. Only output the raw, parseable JSON.
- Every string inside the JSON object must be properly escaped. Raw line breaks in lesson descriptions or markdown content must be escaped as '\\n'.
- Double quotes inside string values must be escaped as '\\"'.
- Do not include trailing commas in arrays or objects.
`;
