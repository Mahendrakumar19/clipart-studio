require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  // Use the image generation model
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
  
  try {
    console.log('Attempting to generate image with gemini-2.5-flash-image...');
    const result = await model.generateContent('Generate a cartoon clipart portrait of a friendly robot, white background, flat colors.');
    
    // Check if there are any inlineData parts in the response (images)
    const response = await result.response;
    const candidates = response.candidates;
    
    fs.writeFileSync('test_gemini_image.json', JSON.stringify(candidates, null, 2));
    
    console.log('Response received. check test_gemini_image.json');
    
    // Look for image data
    let imageFound = false;
    for (const candidate of candidates) {
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
          console.log('SUCCESS! Found image in response.');
          const buffer = Buffer.from(part.inlineData.data, 'base64');
          fs.writeFileSync('generated_test.png', buffer);
          imageFound = true;
        }
      }
    }
    
    if (!imageFound) {
      console.log('No image found in parts. Text output:', response.text());
    }
    
  } catch (err) {
    console.error('ERROR:', err.message);
    if (err.response) {
      console.error('Response Error:', JSON.stringify(err.response, null, 2));
    }
  }
}

test();
