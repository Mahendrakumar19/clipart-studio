require('dotenv').config();
const { generateClipart } = require('./services/aihorde');

async function test() {
  const fakeBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  
  try {
    console.log('Testing AI Horde with simple 1x1 image...');
    const url = await generateClipart(fakeBase64, 'cartoon');
    console.log('SUCCESS! AI Horde output:', url);
  } catch (err) {
    console.error('FAILED! AI Horde error:', err.message);
  }
}

test();
