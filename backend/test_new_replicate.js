require('dotenv').config();
const Replicate = require('replicate');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function test() {
  const MODEL = 'lucataco/sdxl-controlnet:06d6fae3b75ab68a28cd2900afa6033166910dd09fd9751047043a5bbb4c184b';
  
  // 1x1 base64 pixel
  const fakeBase64 = 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  
  try {
    console.log('Testing Replicate with new token...');
    console.log('Token:', process.env.REPLICATE_API_TOKEN?.substring(0, 10) + '...');
    
    const output = await replicate.run(MODEL, {
      input: {
        image: fakeBase64,
        prompt: "cartoon clipart portrait, white background",
        num_inference_steps: 20,
      },
    });
    
    console.log('SUCCESS! Replicate output:', output);
  } catch (err) {
    console.error('FAILED! Replicate error:', err.message);
  }
}

test();
