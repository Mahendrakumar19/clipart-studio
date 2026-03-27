/**
 * Prompts are carefully tuned to:
 * 1. Preserve the subject's facial identity
 * 2. Produce clean, clipart-appropriate outputs (no photorealism)
 * 3. Use white/transparent backgrounds for easy download
 */

const PROMPTS = {
  cartoon: {
    positive: [
      'bold cartoon clipart',
      'thick black outlines',
      'vibrant cel-shaded flat colors',
      'modern vector pop art style',
      'Disney Pixar character aesthetic',
      'clean professional illustration',
      'high contrast',
      'solid white background',
      'no gradients',
      'masterpiece',
    ].join(', '),
    negative: [
      'photorealistic',
      'blurry',
      'realistic skin',
      '3d render',
      'shading',
      'gradients',
      'lowres',
      'text',
      'watermark',
    ].join(', '),
  },

  anime: {
    positive: [
      'anime portrait clipart',
      'Studio Ghibli soft aesthetic',
      'Makoto Shinkai lighting',
      'clean cel-shading',
      'sharp hair highlights',
      'expressive anime eyes',
      'beautiful anime girl/boy portrait',
      'soft pastel colors',
      'white background',
      'high quality anime art',
    ].join(', '),
    negative: [
      'photorealistic',
      'western cartoon',
      'ugly',
      'sketchy',
      'low quality',
      'distorted',
      'text',
      'watermark',
    ].join(', '),
  },

  pixel: {
    positive: [
      '16-bit pixel art character',
      'retro console game sprite',
      'crisp square pixels',
      'limited color palette',
      'NES SNES Sega aesthetic',
      'arcade game portrait',
      'centered sprite',
      'white background',
      'no anti-aliasing',
      'authentic pixel art',
    ].join(', '),
    negative: [
      'photorealistic',
      'smooth',
      'blurry',
      'gradient',
      'anti-aliased',
      'high res',
      'high quality painting',
    ].join(', '),
  },

  sketch: {
    positive: [
      'artistic pencil sketch',
      'charcoal line art portrait',
      'high contrast black and white',
      'rough messy artistic strokes',
      'cross-hatching shading',
      'hand-drawn illustration',
      'fine detailed graphite lines',
      'white paper background',
      'masterpiece drawing',
    ].join(', '),
    negative: [
      'color',
      'photorealistic',
      'digital painting',
      'blurry',
      'flat colors',
      'cartoon',
      'low quality',
    ].join(', '),
  },

  flat: {
    positive: [
      'minimalist flat design vector',
      'corporate Memphis style illustration',
      'clean geometric shapes',
      'bold solid colors',
      'modern landing page art',
      'minimal portrait icon',
      'no shadows',
      'no gradients',
      'white background',
      'professional graphic design',
    ].join(', '),
    negative: [
      'photorealistic',
      'shading',
      '3d',
      'texture',
      'gradients',
      'complex details',
      'fuzzy',
    ].join(', '),
  },
};

module.exports = { PROMPTS };
