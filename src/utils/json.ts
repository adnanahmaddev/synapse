/**
 * Helper to find the previous non-whitespace character in a string.
 */
function getPrevNonWhitespaceChar(str: string, idx: number): string {
  let p = idx - 1;
  while (p >= 0 && /\s/.test(str[p])) {
    p--;
  }
  return p >= 0 ? str[p] : '';
}

/**
 * Robust JSON parser to handle outputs from local LLMs that might contain
 * markdown code wrappers, leading/trailing conversational text, raw newlines 
 * inside JSON string values, trailing commas, unescaped internal double quotes,
 * or incomplete/truncated JSON structures.
 */
export function cleanAndParseJSON(text: string): unknown {
  if (!text) {
    throw new Error("Empty response received from the model.");
  }

  // 1. Locate the JSON block boundaries
  const startIdx = text.indexOf('{');
  if (startIdx === -1) {
    throw new Error("Could not find start of JSON ('{') in the response.");
  }
  
  let endIdx = text.lastIndexOf('}');
  if (endIdx === -1 || endIdx < startIdx) {
    // Truncated before any closing brace
    endIdx = text.length - 1;
  }
  
  let jsonStr = text.substring(startIdx, endIdx + 1);

  // 2. Remove trailing commas in arrays/objects (e.g. [1, 2, 3,] or {a:1,})
  jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');

  try {
    return JSON.parse(jsonStr);
  } catch (err: unknown) {
    const error = err as Error;
    console.warn("Standard JSON.parse failed. Attempting advanced cleanup for local model output...", error.message);
    
    try {
      // 3. Step A: LIFO Stack-based bracket/brace closer to handle truncated JSON
      const stack: string[] = [];
      let inString = false;
      let escaped = false;
      
      for (let i = 0; i < jsonStr.length; i++) {
        const char = jsonStr[i];
        if (char === '\\' && inString) {
          escaped = !escaped;
        } else if (char === '"' && !escaped) {
          inString = !inString;
        } else if (!inString) {
          if (char === '{') {
            stack.push('}');
          } else if (char === '[') {
            stack.push(']');
          } else if (char === '}') {
            if (stack[stack.length - 1] === '}') stack.pop();
          } else if (char === ']') {
            if (stack[stack.length - 1] === ']') stack.pop();
          }
        } else {
          escaped = false;
        }
      }

      if (inString) {
        jsonStr += '"';
        inString = false;
      }

      while (stack.length > 0) {
        jsonStr += stack.pop();
      }

      // 4. Step B: Clean up unescaped double quotes inside strings & raw control characters
      let repaired = '';
      let i = 0;
      
      while (i < jsonStr.length) {
        const char = jsonStr[i];
        
        if (char === '"') {
          const startIdxStr = i;
          let nextQuoteIdx = -1;
          let searchIdx = i + 1;
          
          while (searchIdx < jsonStr.length) {
            const c = jsonStr[searchIdx];
            if (c === '\\') {
              searchIdx += 2;
              continue;
            }
            if (c === '"') {
              const rest = jsonStr.substring(searchIdx + 1);
              const matchKey = rest.match(/^\s*:/);
              const matchVal = rest.match(/^\s*([,}\]])/);
              
              if (matchKey || matchVal) {
                const prevChar = getPrevNonWhitespaceChar(jsonStr, startIdxStr);
                
                let isStructural = false;
                if (matchKey && (prevChar === '{' || prevChar === ',' || prevChar === '')) {
                  isStructural = true;
                } else if (matchVal && (prevChar === ':' || prevChar === '[' || prevChar === ',')) {
                  isStructural = true;
                }
                
                if (isStructural) {
                  nextQuoteIdx = searchIdx;
                  break;
                }
              }
            }
            searchIdx++;
          }
          
          if (nextQuoteIdx !== -1) {
            const inside = jsonStr.substring(startIdxStr + 1, nextQuoteIdx);
            let escapedInside = '';
            for (let j = 0; j < inside.length; j++) {
              const ic = inside[j];
              if (ic === '"') {
                const prevChar = j > 0 ? inside[j - 1] : '';
                if (prevChar !== '\\') {
                  escapedInside += '\\"';
                } else {
                  escapedInside += ic;
                }
              } else {
                if (ic === '\n') {
                  escapedInside += '\\n';
                } else if (ic === '\r') {
                  escapedInside += '\\r';
                } else if (ic === '\t') {
                  escapedInside += '\\t';
                } else {
                  escapedInside += ic;
                }
              }
            }
            repaired += '"' + escapedInside + '"';
            i = nextQuoteIdx + 1;
          } else {
            repaired += char;
            i++;
          }
        } else {
          repaired += char;
          i++;
        }
      }

      // Remove trailing commas in arrays/objects in repaired string
      repaired = repaired.replace(/,\s*([\]}])/g, '$1');

      return JSON.parse(repaired);
    } catch (innerErr: unknown) {
      console.error("Advanced JSON parsing cleanup failed:", innerErr);
      throw new Error(`JSON Parse Error: ${error.message}. Please try again or switch to a different model.`);
    }
  }
}
