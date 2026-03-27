const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PROMPTS } = require('../utils/prompts');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

/**
 * GEMINI-ENHANCED FREE MODE
 * 
 * 1. Gemini (Vision) -> Analyzes the photo to create a detailed artistic prompt.
 * 2. Pollinations -> Generates the actual clipart with the detailed prompt.
 * 
 * Supports custom prompt additions and intensity control.
 */

/**
 * Extracts a visual description from an image using Gemini.
 * Call this once per session/batch to save quota!
 */
async function describeImage(base64Image) {
  try {
    const result = await visionModel.generateContent([
      `Describe the person in this photo specifically for a character artist. 
       Gender, age, hair style/color, facial features, and expression. 
       Max 20 words.`,
      {
        inlineData: { data: base64Image, mimeType: 'image/jpeg' },
      },
    ]);
    return result.response.text().trim().replace(/[".]/g, '');
  } catch (err) {
    console.warn(`[gemini] vision error: ${err.message}`);
    return 'a person matching the style';
  }
}

async function generateClipart(base64Image, style, preloadedDescription = null, opts = {}) {
  const promptData = PROMPTS[style];
  if (!promptData) throw new Error(`Unknown style: ${style}`);

  const visualDescription = preloadedDescription || await describeImage(base64Image);
  if (preloadedDescription) {
    console.log(`[gemini] using cached description for ${style}`);
  } else {
    console.log(`[gemini] vision: ${visualDescription}`);
  }

  let finalPrompt = `${promptData.positive}. Character portrait based on ${visualDescription}. High quality, clean, professional artwork, masterpiece.`;
  if (opts.customPrompt) {
    finalPrompt = `${promptData.positive}, ${opts.customPrompt}. Portrait of ${visualDescription}.`;
  }

  const encodedPrompt = encodeURIComponent(finalPrompt);
  const seed = Math.floor(Math.random() * 999999);
  
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true`;
}

module.exports = { generateClipart, describeImage };
