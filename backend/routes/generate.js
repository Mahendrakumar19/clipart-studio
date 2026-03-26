const express = require('express');
const { body, validationResult } = require('express-validator');

// Import all services
const replicate = require('../services/replicate');
const aihorde = require('../services/aihorde');
const pollinations = require('../services/pollinations');

const router = express.Router();

const VALID_STYLES = ['cartoon', 'anime', 'pixel', 'sketch', 'flat'];

// Memory cache for session state (reset on restart)
let isReplicateBlocked = false;
const sessionDescriptions = new Map();

const validateRequest = [
  body('imageBase64').isString().notEmpty(),
  body('style').isString().isIn(VALID_STYLES),
  body('customPrompt').optional().isString().isLength({ max: 200 }),
  body('intensity').optional().isFloat({ min: 0, max: 1 }),
];

/**
 * SMART GENERATION ROUTE (v4 - Parallel + Custom Prompt + Intensity)
 */
router.post('/', validateRequest, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { imageBase64, style, customPrompt, intensity } = req.body;
  const imgKey = imageBase64.substring(0, 100);

  console.log(`[generate] style=${style} prompt="${customPrompt || 'default'}" intensity=${intensity ?? 0.75}`);

  try {
    // 0. Pre-generate Description (Used by both AI Horde and Pollinations)
    let description = sessionDescriptions.get(imgKey);
    if (!description && !req.body.skipVision) {
      console.log(`[generate] generating vision description for ${style}...`);
      description = await pollinations.describeImage(imageBase64);
      sessionDescriptions.set(imgKey, description);
      setTimeout(() => sessionDescriptions.delete(imgKey), 5 * 60 * 1000);
    }

    const opts = {
      customPrompt: customPrompt || '',
      intensity: intensity ?? 0.75,
    };

    // Stage 1: Try Replicate (High Quality ControlNet)
    if (process.env.REPLICATE_API_TOKEN && !isReplicateBlocked) {
      try {
        const url = await replicate.generateClipart(imageBase64, style, opts);
        console.log(`[generate] replicate success`);
        return res.json({ imageUrl: url, style, provider: 'replicate' });
      } catch (err) {
        if (err.message?.includes('402')) {
          console.warn(`[generate] replicate 402 - switching to free modes`);
          isReplicateBlocked = true; 
        }
      }
    }

    // Stage 2: Try AI Horde (Free Image-to-Image / Similarity)
    try {
      console.log(`[generate] trying aihorde img2img for ${style}...`);
      const url = await aihorde.generateClipart(imageBase64, style, description, opts);
      return res.json({ imageUrl: url, style, provider: 'aihorde' });
    } catch (err) {
      console.warn(`[generate] aihorde skipped/failed: ${err.message}`);
    }

    // Stage 3: Fallback - Pollinations (Instant Text-to-Image)
    console.log(`[generate] using pollinations fallback for ${style}...`);
    const url = await pollinations.generateClipart(imageBase64, style, description, opts);
    res.json({ imageUrl: url, style, provider: 'pollinations' });

  } catch (err) {
    console.error(`[generate] critical failure:`, err.message);
    res.status(500).json({ error: 'All services failed.' });
  }
});

module.exports = router;
