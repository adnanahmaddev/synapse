/**
 * Robust JSON parser to handle outputs from local LLMs that might contain
 * markdown code wrappers, leading/trailing conversational text, raw newlines 
 * inside JSON string values, or trailing commas.
 */
export function cleanAndParseJSON(text: string): any {
  if (!text) {
    throw new Error("Empty response received from the model.");
  }

  // 1. Locate the JSON block boundaries
  const startIdx = text.indexOf('{');
  const endIdx = text.lastIndexOf('}');
  
  if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
    throw new Error("Could not find valid JSON boundaries (missing '{' or '}') in the response.");
  }
  
  let jsonStr = text.substring(startIdx, endIdx + 1);

  // 2. Remove trailing commas in arrays/objects (e.g. [1, 2, 3,] or {a:1,})
  jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');

  try {
    return JSON.parse(jsonStr);
  } catch (err: any) {
    console.warn("Standard JSON.parse failed. Attempting advanced cleanup for local model output...", err.message);
    
    try {
      // 3. Heuristic: Fix raw unescaped newlines and tabs inside JSON string values
      // We look at text between quotes and escape raw control characters
      let inString = false;
      let escaped = false;
      let cleanedChars: string[] = [];

      for (let i = 0; i < jsonStr.length; i++) {
        const char = jsonStr[i];

        if (char === '"' && !escaped) {
          inString = !inString;
          cleanedChars.push(char);
        } else if (inString) {
          if (char === '\\') {
            escaped = !escaped;
            cleanedChars.push(char);
          } else {
            if (char === '\n') {
              cleanedChars.push('\\n');
            } else if (char === '\r') {
              cleanedChars.push('\\r');
            } else if (char === '\t') {
              cleanedChars.push('\\t');
            } else {
              cleanedChars.push(char);
            }
            escaped = false;
          }
        } else {
          cleanedChars.push(char);
          escaped = false;
        }
      }

      const cleanedStr = cleanedChars.join('');
      return JSON.parse(cleanedStr);
    } catch (innerErr: any) {
      console.error("Advanced JSON parsing cleanup failed:", innerErr);
      throw new Error(`JSON Parse Error: ${err.message}. Please try again or switch to a different model.`);
    }
  }
}
