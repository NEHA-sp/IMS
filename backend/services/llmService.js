const { GoogleGenAI, GoogleGenAIError } = require('@google/generative-ai');

/**
 * Service to call Gemini LLM to suggest blocker resolution
 * based on knowledge base entries.
 */
class LLMService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.modelName = 'gemini-1.5-flash';
    this.ai = null;

    if (this.apiKey) {
      try {
        // Use standard initialization: require('@google/generative-ai') has { GoogleGenAI } or { GoogleGenerativeAI }
        // Let's inspect the package standard. The newer '@google/generative-ai' uses standard:
        // const { GoogleGenerativeAI } = require('@google/generative-ai');
        // Let's import GoogleGenerativeAI and use it.
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        this.ai = new GoogleGenerativeAI(this.apiKey);
      } catch (err) {
        console.error('Failed to initialize GoogleGenerativeAI client:', err.message);
      }
    } else {
      console.warn('GEMINI_API_KEY is not defined. AI Blocker Suggestions will fall back to manual mentor escalation.');
    }
  }

  /**
   * Suggests a solution for a blocker using Knowledge Base context.
   * @param {string} description Blocker description
   * @param {string} category Blocker category (technical, requirement, system, etc.)
   * @param {Array} kbEntries List of relevant database KB entries
   * @returns {Promise<{suggestion: string, confidence: number, sourceIds: Array<number>, escalated: boolean}>}
   */
  async getBlockerSuggestion(description, category, kbEntries = []) {
    if (!this.ai || !this.apiKey) {
      return {
        suggestion: 'No AI key provided. Blocker has been logged and escalated to your Mentor for review.',
        confidence: 0,
        sourceIds: [],
        escalated: true
      };
    }

    try {
      const model = this.ai.getGenerativeModel({ model: this.modelName });

      // Compile knowledge base context
      let kbContext = 'NO RELEVANT KNOWLEDGE BASE OR FAQ ENTRIES FOUND.';
      if (kbEntries && kbEntries.length > 0) {
        kbContext = kbEntries
          .map((entry, index) => `[Entry #${index + 1}] (ID: ${entry.id}) Category: ${entry.category}\nQuestion/Problem: ${entry.question}\nAnswer/Solution: ${entry.answer}`)
          .join('\n\n');
      }

      const systemPrompt = `You are a helpful AI mentor for Topper IAS Civil Services Exam coaching institute interns.
Your job is to analyze an intern's daily blocker/challenge and suggest a direct solution or workaround.

You are provided with a Knowledge Base (KB) of FAQs and previously resolved blockers.
If a relevant solution is found in the KB, prioritize it and adapt/explain it clearly.
If no direct match exists, formulate a highly relevant, constructive engineering/administrative response.

You MUST respond strictly in the following JSON format:
{
  "suggestion": "Detailed, highly actionable solution or guidance step-by-step.",
  "confidence": 75, // Integer score between 0 and 100 indicating how well the KB or your own knowledge resolves the specific issue
  "sourceIds": [1, 3], // Array of KB Entry IDs that helped answer this, or empty array if none
  "escalated": false // Set to true if confidence is low (< 70) and mentor intervention is required
}

Keep descriptions professional, encouraging, and clear.`;

      const userPrompt = `Blocker Category: ${category}
Blocker Description: "${description}"

---
Available Knowledge Base Context:
${kbContext}
---

Provide your JSON response now:`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        }
      });

      const responseText = result.response.text();
      let responseJson;
      try {
        responseJson = JSON.parse(responseText);
      } catch (parseError) {
        // Fallback parser if JSON isn't perfect
        console.error('Failed to parse Gemini response as JSON. Raw response:', responseText);
        // Clean markdown backticks if any
        const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        responseJson = JSON.parse(cleanedText);
      }

      // Ensure fields exist
      const confidence = typeof responseJson.confidence === 'number' ? responseJson.confidence : 50;
      return {
        suggestion: responseJson.suggestion || 'Please discuss this blocker directly with your Mentor.',
        confidence: confidence,
        sourceIds: Array.isArray(responseJson.sourceIds) ? responseJson.sourceIds : [],
        escalated: responseJson.escalated || confidence < 70
      };

    } catch (err) {
      console.error('Error in LLM Blocker Suggestion:', err);
      return {
        suggestion: `An error occurred while analyzing your blocker: ${err.message}. Your blocker has been escalated to your Mentor.`,
        confidence: 0,
        sourceIds: [],
        escalated: true
      };
    }
  }
}

module.exports = new LLMService();
