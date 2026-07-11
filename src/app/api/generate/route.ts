import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { 
  DEFAULT_OLLAMA_HOST, 
  DEFAULT_OLLAMA_MODEL, 
  DEFAULT_GEMINI_MODEL, 
  SYLLABUS_SYSTEM_PROMPT 
} from '@/utils/constants';
import { cleanAndParseJSON } from '@/utils/json';

// Unified Schema definition for Gemini Structured Outputs
const syllabusSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING, description: "The title of the generated course." },
    description: { type: SchemaType.STRING, description: "A brief description or overview of the course." },
    modules: {
      type: SchemaType.ARRAY,
      description: "List of learning modules (2-3 modules recommended).",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: "A unique slug/id for the module." },
          title: { type: SchemaType.STRING, description: "The title of the module." },
          lessons: {
            type: SchemaType.ARRAY,
            description: "List of lessons inside this module (3-5 total lessons across the whole course).",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING, description: "A unique slug/id for the lesson." },
                title: { type: SchemaType.STRING, description: "The title of the lesson." },
                concept: { type: SchemaType.STRING, description: "A short label of the core concept being assessed (e.g. 'Staging Area')." },
                content: { type: SchemaType.STRING, description: "The main text explanation of the lesson, formatted in Markdown." },
                componentType: {
                  type: SchemaType.STRING,
                  description: "The interactive widget to mount: 'quiz', 'mermaid', 'playground', or 'visualizer'. Choose the one that best fits the subject matter.",
                  enum: ["quiz", "playground", "visualizer", "mermaid"]
                },
                quizData: {
                  type: SchemaType.OBJECT,
                  description: "Required only if componentType is 'quiz'. A multiple-choice question.",
                  properties: {
                    question: { type: SchemaType.STRING },
                    options: {
                      type: SchemaType.ARRAY,
                      items: { type: SchemaType.STRING },
                      description: "List of exactly 4 choices."
                    },
                    correctIndex: { type: SchemaType.INTEGER, description: "0-indexed correct option." },
                    explanation: { type: SchemaType.STRING, description: "The AI explanation shown when the user answers." }
                  },
                  required: ["question", "options", "correctIndex", "explanation"]
                },
                codeTemplate: {
                  type: SchemaType.OBJECT,
                  description: "Required only if componentType is 'playground'. Boilerplate code for interactive HTML/JS editor.",
                  properties: {
                    html: { type: SchemaType.STRING, description: "HTML code template." },
                    css: { type: SchemaType.STRING, description: "CSS stylesheet code template." },
                    js: { type: SchemaType.STRING, description: "JavaScript source template." }
                  },
                  required: ["html", "css", "js"]
                },
                visualizerData: {
                  type: SchemaType.OBJECT,
                  description: "Required only if componentType is 'visualizer'. Settings for interactive slider math graphs.",
                  properties: {
                    type: {
                      type: SchemaType.STRING,
                      description: "The mathematical graph formula preset.",
                      enum: ["linear", "sine", "interest"]
                    },
                    title: { type: SchemaType.STRING, description: "Title of the visual graph." },
                    equation: { type: SchemaType.STRING, description: "Formula to display (LaTeX or string notation, e.g., y = mx + c)." },
                    params: {
                      type: SchemaType.ARRAY,
                      description: "List of parameters controllable by slider inputs.",
                      items: {
                        type: SchemaType.OBJECT,
                        properties: {
                          name: { type: SchemaType.STRING, description: "Parameter name (e.g. 'm', 'c', 'A', 'f')." },
                          min: { type: SchemaType.NUMBER },
                          max: { type: SchemaType.NUMBER },
                          defaultValue: { type: SchemaType.NUMBER }
                        },
                        required: ["name", "min", "max", "defaultValue"]
                      }
                    }
                  },
                  required: ["type", "title", "equation", "params"]
                },
                mermaidCode: {
                  type: SchemaType.STRING,
                  description: "Required only if componentType is 'mermaid'. A valid, self-contained Mermaid.js diagram definition (e.g., graph TD...)."
                }
              },
              required: ["id", "title", "concept", "content", "componentType"]
            }
          }
        },
        required: ["id", "title", "lessons"]
      }
    }
  },
  required: ["title", "description", "modules"]
};

// System prompt explaining instructions clearly
const systemPrompt = SYLLABUS_SYSTEM_PROMPT;

export async function POST(request: Request) {
  try {
    const { prompt, modelConfig } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const provider = modelConfig?.provider || 'gemini';

    if (provider === 'gemini') {
      const apiKey = modelConfig?.apiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: "Missing Gemini API Key. Provide it in Settings or configure locally." }, { status: 400 });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      // Use gemini-2.5-flash (or gemini-1.5-flash as fallback)
      const model = genAI.getGenerativeModel({
        model: modelConfig?.model || DEFAULT_GEMINI_MODEL,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: syllabusSchema as any,
        }
      });

      const result = await model.generateContent([
        { text: systemPrompt },
        { text: `Generate a syllabus for: "${prompt}"` }
      ]);

      const responseText = result.response.text();
      const courseData = cleanAndParseJSON(responseText);
      return NextResponse.json(courseData);

    } else if (provider === 'ollama') {
      const host = modelConfig?.host || process.env.OLLAMA_HOST || DEFAULT_OLLAMA_HOST;
      const modelName = modelConfig?.model || process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;

      const response = await fetch(`${host}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt + "\nGenerate output matching this JSON schema:\n" + JSON.stringify(syllabusSchema) },
            { role: 'user', content: `Generate a syllabus for: "${prompt}"` }
          ],
          format: 'json',
          stream: false
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama error: ${errText}`);
      }

      const ollamaData = await response.json();
      const responseText = ollamaData?.message?.content || "";

      // Clean responseText and parse robustly
      const courseData = cleanAndParseJSON(responseText);
      return NextResponse.json(courseData);

    } else {
      return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Course generation failed:", error);
    return NextResponse.json({ error: error.message || "Failed to generate course" }, { status: 500 });
  }
}
