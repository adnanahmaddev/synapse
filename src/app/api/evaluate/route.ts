import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { 
  DEFAULT_OLLAMA_HOST, 
  DEFAULT_OLLAMA_MODEL, 
  DEFAULT_GEMINI_MODEL, 
  EVALUATE_SYSTEM_PROMPT 
} from '@/utils/constants';
import { cleanAndParseJSON } from '@/utils/json';

const evaluateSchema = {
  type: SchemaType.OBJECT,
  properties: {
    score: { type: SchemaType.INTEGER, description: "A percentage score from 0 to 100 representing the user's understanding." },
    correctPoints: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Bullet points detailing correct concepts or details the user successfully recalled."
    },
    gaps: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Bullet points detailing misconceptions, inaccuracies, or critical gaps the user missed."
    },
    suggestions: {
      type: SchemaType.STRING,
      description: "A constructive, encouraging suggestion for what they should review or focus on next."
    }
  },
  required: ["score", "correctPoints", "gaps", "suggestions"]
};

const systemPrompt = EVALUATE_SYSTEM_PROMPT;

export async function POST(request: Request) {
  try {
    const { lessonConcept, lessonContent, userSummary, modelConfig } = await request.json();

    if (!lessonConcept || !lessonContent || !userSummary) {
      return NextResponse.json({ error: "lessonConcept, lessonContent, and userSummary are required." }, { status: 400 });
    }

    const provider = modelConfig?.provider || 'gemini';

    const userPrompt = `
Lesson Concept: "${lessonConcept}"
Lesson Content:
"""
${lessonContent}
"""

Student's Summary:
"""
${userSummary}
"""
    `;

    if (provider === 'gemini') {
      const apiKey = modelConfig?.apiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: "Missing Gemini API Key. Provide it in Settings or configure locally." }, { status: 400 });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelConfig?.model || DEFAULT_GEMINI_MODEL,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: evaluateSchema as any,
        }
      });

      const result = await model.generateContent([
        { text: systemPrompt },
        { text: userPrompt }
      ]);

      const responseText = result.response.text();
      const evalData = cleanAndParseJSON(responseText);
      return NextResponse.json(evalData);

    } else if (provider === 'ollama') {
      const host = modelConfig?.host || process.env.OLLAMA_HOST || DEFAULT_OLLAMA_HOST;
      const modelName = modelConfig?.model || process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;

      const response = await fetch(`${host}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt + "\nGenerate output matching this JSON schema:\n" + JSON.stringify(evaluateSchema) },
            { role: 'user', content: userPrompt }
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
      const evalData = cleanAndParseJSON(responseText);
      return NextResponse.json(evalData);

    } else {
      return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Recall evaluation failed:", error);
    return NextResponse.json({ error: error.message || "Failed to evaluate recall" }, { status: 500 });
  }
}
