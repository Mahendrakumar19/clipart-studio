require('dotenv').config();
const fs = require('fs');

async function test() {
  // Test 1: Gemini API key status
  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await resp.json();
    fs.writeFileSync('test_output.txt', 'Gemini Status: ' + resp.status + '\n');
    if (!resp.ok) {
      fs.appendFileSync('test_output.txt', 'Gemini Error: ' + JSON.stringify(data) + '\n');
    } else {
      fs.appendFileSync('test_output.txt', 'Gemini OK: Found ' + (data.models?.length || 0) + ' models\n');
    }
  } catch (err) {
    fs.writeFileSync('test_output.txt', 'Gemini network error: ' + err.message + '\n');
  }

  // Test 2: Try Hugging Face free inference API (no auth needed for some models)
  try {
    const resp = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: 'cartoon clipart portrait, white background' }),
    });
    fs.appendFileSync('test_output.txt', '\nHF Free Status: ' + resp.status + '\n');
    fs.appendFileSync('test_output.txt', 'HF Content-Type: ' + resp.headers.get('content-type') + '\n');
    if (!resp.ok) {
      const text = await resp.text();
      fs.appendFileSync('test_output.txt', 'HF Error: ' + text.substring(0, 500) + '\n');
    } else {
      fs.appendFileSync('test_output.txt', 'HF OK: Got image response\n');
    }
  } catch (err) {
    fs.appendFileSync('test_output.txt', 'HF error: ' + err.message + '\n');
  }
  
  console.log('Done');
}

test();
