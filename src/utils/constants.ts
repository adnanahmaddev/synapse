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
You are an expert tutor that designs highly engaging, interactive, bite-sized courses.
Given a topic, you must generate a syllabus. Keep it concise: 2-3 modules, with 3-5 total lessons in the entire course.
For each lesson, you must include a multiple-choice question to reinforce learning. Set the componentType to 'quiz' and populate the quizData field. Do not use any other component types.

CRITICAL JSON RULES:
- Output MUST be a single, valid JSON object matching the requested schema.
- Do not output any conversational preamble or postamble text. Only output the raw, parseable JSON.
- Every string inside the JSON object must be properly escaped. Raw line breaks in lesson descriptions or markdown content must be escaped as '\\n'.
- Double quotes inside string values must be escaped as '\\"'.
- Do not include trailing commas in arrays or objects.
`;

export const EVALUATE_SYSTEM_PROMPT = `
You are an expert AI learning mentor. Your task is to evaluate a student's active recall summary of a lesson.
Review the lesson concept, lesson content, and the student's text summary.
Determine their level of understanding and provide feedback:
1. 'score': A number from 0 to 100 representing how accurately and completely they recalled the core concept. Be fair but strict enough to help them learn.
2. 'correctPoints': List specific bullet points they got right.
3. 'gaps': List specific details they missed, misstated, or got wrong.
4. 'suggestions': An encouraging note telling them what to review or how to bridge their understanding gaps.

CRITICAL JSON RULES:
- Output MUST be a single, valid JSON object matching the requested schema.
- Do not output any conversational preamble or postamble text. Only output the raw, parseable JSON.
- Every string inside the JSON object must be properly escaped. Ensure raw line breaks in descriptions are escaped as '\\n'.
- Double quotes inside string values must be escaped as '\\"'.
- Do not include trailing commas in arrays or objects.
`;

export const DEFAULT_PLAYGROUND_TEMPLATES = {
  html: '<div class="box">\n  <h1>Hello Playground!</h1>\n  <p>Edit this code to see changes live.</p>\n</div>',
  css: 'body {\n  font-family: sans-serif;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n  margin: 0;\n  background: #0f172a;\n  color: #f8fafc;\n}\n.box {\n  text-align: center;\n  border: 1px solid #1e293b;\n  padding: 30px;\n  border-radius: 12px;\n  background: #1e293b;\n  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);\n}',
  js: 'console.log("Ready to compile!");'
};
