// Quick test script for Suno API
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testSunoAPI() {
  const apiKey = process.env.SUNO_API_KEY;
  
  if (!apiKey) {
    console.error('No SUNO_API_KEY found in .env.local');
    return;
  }

  console.log('Testing Suno API with key:', apiKey.substring(0, 10) + '...');

  try {
    // Test basic API connectivity
    const response = await fetch('https://api.sunoapi.org/api/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'A simple love song',
        style: 'Pop',
        title: 'Test Song',
        customMode: true,
        instrumental: false,
        model: 'V4'
      }),
    });

    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response body:', text);
    
    try {
      const data = JSON.parse(text);
      console.log('Parsed JSON:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('Response is not valid JSON');
    }

  } catch (error) {
    console.error('Error testing Suno API:', error);
  }
}

testSunoAPI();