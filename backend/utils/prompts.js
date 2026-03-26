/**
 * Prompts are carefully tuned to:
 * 1. Preserve the subject's facial identity
 * 2. Produce clean, clipart-appropriate outputs (no photorealism)
 * 3. Use white/transparent backgrounds for easy download
 */

const PROMPTS = {
  cartoon: {
    positive: [
      'cartoon portrait clipart',
      'bold black outlines',
      'flat cel-shaded colors',
      'Disney/Pixar animation style',
      'maintain facial features and identity of the person',
      'clean vector illustration',
      'white background',
      'centered portrait bust',
      'vibrant saturated colors',
      'no text, no watermark',
      'high quality',
    ].join(', '),
    negative: [
      'photorealistic',
      'realistic skin texture',
      'photography',
      'blurry',
      'low quality',
      'distorted face',
      'extra limbs',
    ].join(', '),
  },

  anime: {
    positive: [
      'anime style portrait',
      'Studio Ghibli soft illustration',
      'clean cel-shaded line art',
      'large expressive eyes',
      'soft gradient shading',
      'maintain person facial structure',
      'white background',
      'pastel color palette',
      'centered portrait',
      'no text, no watermark',
      'high quality anime art',
    ].join(', '),
    negative: [
      'photorealistic',
      'western cartoon',
      'ugly',
      'deformed',
      'blurry',
      'extra eyes',
      'low quality',
    ].join(', '),
  },

  pixel: {
    positive: [
      '16-bit pixel art portrait',
      'retro game character sprite',
      'crisp pixel edges',
      'limited color palette',
      'maintain subject facial identity',
      'white background',
      'centered character',
      'SNES RPG character art style',
      'clean pixel art',
      'no anti-aliasing',
      'no text, no watermark',
    ].join(', '),
    negative: [
      'photorealistic',
      'smooth gradients',
      'blurry',
      'anti-aliased',
      'low quality',
      'distorted',
    ].join(', '),
  },

  sketch: {
    positive: [
      'pencil sketch portrait',
      'black and white line art',
      'fine detailed outlines',
      'hatching shading technique',
      'maintain facial features of subject',
      'white background',
      'artistic pencil drawing',
      'clean strokes',
      'portrait illustration',
      'no text, no watermark',
    ].join(', '),
    negative: [
      'photorealistic',
      'color',
      'digital painting',
      'blurry',
      'low quality',
      'ugly',
    ].join(', '),
  },

  flat: {
    positive: [
      'flat design vector illustration',
      'minimal geometric shapes',
      'bold flat colors no gradients',
      'modern icon illustration style',
      'maintain subject identity',
      'white background',
      'clean simple shapes',
      'contemporary flat art',
      'portrait illustration',
      'no text, no watermark',
      'high quality flat design',
    ].join(', '),
    negative: [
      'photorealistic',
      'gradients',
      'shadows',
      'complex textures',
      'blurry',
      'low quality',
    ].join(', '),
  },
};

module.exports = { PROMPTS };
