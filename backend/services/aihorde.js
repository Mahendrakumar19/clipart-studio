const { PROMPTS } = require('../utils/prompts');

const AI_HORDE_URL = 'https://aihorde.net/api/v2';
const ANONYMOUS_KEY = '0000000000';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * AI Horde Service (Community Powered Free Generation)
 * Supports custom prompt and intensity via denoising_strength.
 */
async function generateClipart(base64Image, style, visualDescription = '', opts = {}) {
  const promptData = PROMPTS[style];
  if (!promptData) throw new Error(`Unknown style: ${style}`);

  let combinedPrompt = `${promptData.positive}. Portrait of ${visualDescription}. Artistic, clean, vibrant.`;
  if (opts.customPrompt) {
    combinedPrompt = `${combinedPrompt}, ${opts.customPrompt}`;
  }

  // Map intensity to denoising_strength (lower = more faithful)
  const denoisingStrength = opts.intensity !== undefined
    ? 0.3 + (1 - opts.intensity) * 0.5 // 1→0.3 (faithful), 0→0.8 (stylized)
    : 0.6;

  console.log(`[aihorde] requesting ${style} (denoising=${denoisingStrength.toFixed(2)})...`);

  const submitResp = await fetch(`${AI_HORDE_URL}/generate/async`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.AI_HORDE_API_KEY || ANONYMOUS_KEY,
      'Client-Agent': 'ClipartStudio:1.0:antigravity'
    },
    body: JSON.stringify({
      prompt: combinedPrompt,
      params: {
        steps: 20,    
        n: 1,
        sampler_name: 'k_euler',
        width: 512,
        height: 512,
        cfg_scale: 7,
        denoising_strength: denoisingStrength,
        karras: true,
      },
      source_image: base64Image,
      source_processing: 'img2img',
      models: ['stable_diffusion'],
    }),
  });

  const submitData = await submitResp.json();
  const id = submitData.id;
  if (!id) {
    console.error('[aihorde] submit failed:', submitData);
    throw new Error('Failed to get job ID from AI Horde');
  }

  // Poll for results (max 2 minutes)
  for (let i = 0; i < 40; i++) {
    await sleep(4000);
    
    const checkResp = await fetch(`${AI_HORDE_URL}/generate/check/${id}`);
    const checkData = await checkResp.json();
    
    if (checkData.finished > 0) {
      const statusResp = await fetch(`${AI_HORDE_URL}/generate/status/${id}`);
      const resultData = await statusResp.json();
      
      if (resultData.generations && resultData.generations.length > 0) {
        console.log(`[aihorde] success for ${style}`);
        return resultData.generations[0].img;
      }
      throw new Error('Image finished but no generations found');
    }
    
    console.log(`[aihorde] status: ${checkData.processing ? 'processing' : 'queued'} (pos: ${checkData.queue_position || 0}/wait: ${checkData.wait_time}s)`);
  }

  throw new Error('AI Horde request timed out');
}

module.exports = { generateClipart };
