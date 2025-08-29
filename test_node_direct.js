const API_KEY = "sk-Jki0Lwj8P6HTWF6H2lsGsX3RsKuSPGe6qeVdFJPOWgxZJTKW";
const VENDOR_BASE = "https://wisdom-gate.juheapi.com/v1";

async function testDirectCall() {
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'User-Agent': 'python-requests/2.31.0',
    'Accept-Encoding': 'gzip, deflate',
    'Accept': '*/*',
    'Connection': 'keep-alive'
  };

  const data = {
    "model": "wisdom-ai-dsv3",
    "messages": [
      {
        "role": "user",
        "content": "Hello, this is a test message through direct Node.js call."
      }
    ],
    "max_tokens": 100
  };

  console.log('Testing direct Node.js call...');
  console.log('API Key:', API_KEY.substring(0, 10) + '...');
  console.log('URL:', VENDOR_BASE + '/chat/completions');
  console.log('Headers:', headers);
  console.log('Data:', JSON.stringify(data));
  console.log('');

  try {
    const response = await fetch(`${VENDOR_BASE}/chat/completions`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    });

    console.log('Status Code:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Response Headers:', Object.fromEntries([...response.headers]));
    
    const result = await response.text();
    console.log('Response Body:', result);
    
    if (response.ok) {
      const parsed = JSON.parse(result);
      console.log('Success! Parsed response:', JSON.stringify(parsed, null, 2));
    } else {
      console.log('Error: HTTP', response.status);
    }
  } catch (e) {
    console.log('Exception:', e.message);
  }
}

testDirectCall();