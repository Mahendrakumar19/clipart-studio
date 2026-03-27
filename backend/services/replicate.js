const Replicate = require('replicate');
const { PROMPTS } = require('../utils/prompts');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * SDXL ControlNet model for image-to-image style transfer.
 * ControlNet preserves facial structure while prompt drives style.
 */
const MODEL = 'lucataco/sdxl-controlnet:06d6fae3b75ab68a28cd2900afa6033166910dd09fd9751047043a5bbb4c184b';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generates a single clipart style for the given base64 image.
 * Supports custom prompt additions and intensity (ControlNet strength).
 */
async function generateClipart(base64Image, style, opts = {}, attempt = 1) {
  const promptData = PROMPTS[style];
  if (!promptData) {
    throw new Error(`Unknown style: ${style}`);
  }

  const dataUri = `data:image/jpeg;base64,${base64Image}`;

  // Merge custom prompt - style prompt MUST come first for weight
  let positivePrompt = promptData.positive;
  if (opts.customPrompt) {
    positivePrompt = `${positivePrompt}, ${opts.customPrompt}`;
  }

  // Map intensity to ControlNet strength (0.35–0.85 range for more style freedom)
  const intensity = opts.intensity ?? 0.5;
  const controlnetStrength = 0.35 + intensity * 0.5; // 0→0.35 (stylized), 0.5→0.6, 1→0.85 (faithful)
  const styleStrength = 0.6 + (1 - intensity) * 0.3; // inverse: more stylized at low intensity

  try {
    const output = await replicate.run(MODEL, {
      input: {
        image: dataUri,
        prompt: positivePrompt,
        negative_prompt: promptData.negative,
        num_inference_steps: 30,
        guidance_scale: 9.5,
        controlnet_conditioning_scale: controlnetStrength,
        strength: styleStrength,
        scheduler: 'K_DPMSOLVER_MULTISTEP',
        seed: Math.floor(Math.random() * 999999),
      },
    });

    const imageUrl = Array.isArray(output) ? output[0] : output;

    if (!imageUrl) {
      throw new Error('Replicate returned no output');
    }

    return imageUrl;
  } catch (err) {
    // Retry on rate-limit (429)
    if (err.message?.includes('429') && attempt <= 3) {
      const retryMatch = err.message.match(/"retry_after":(\d+)/);
      const waitSec = retryMatch ? parseInt(retryMatch[1], 10) + 1 : attempt * 12;
      console.warn(`[replicate] 429 rate-limited for style=${style}, retry ${attempt}/3 after ${waitSec}s`);
      await sleep(waitSec * 1000);
      return generateClipart(base64Image, style, opts, attempt + 1);
    }
    throw err;
  }
}

module.exports = { generateClipart };
