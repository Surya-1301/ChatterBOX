import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Guard initialization so the app can start in environments where AI keys are not set (e.g. Render)
const hasGoogleKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

let _ai: any;
if (hasGoogleKey) {
  _ai = genkit({
    plugins: [googleAI()],
    model: 'googleai/gemini-2.5-flash',
  });
} else {
  // No-op shim: keeps imports valid but throws a clear error when used.
  _ai = {
    call: async () => {
      throw new Error('AI unavailable: set GEMINI_API_KEY or GOOGLE_API_KEY to enable AI features.');
    },
  };
}

export const ai = _ai;
