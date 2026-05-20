import 'dotenv/config';

async function testCerebras() {
  const key = process.env.CEREBRAS_API_KEY;
  if (!key) {
    console.error("No CEREBRAS_API_KEY in environment!");
    return;
  }

  console.log("Cerebras Key:", key.substring(0, 8) + "...");
  try {
    const res = await fetch('https://api.cerebras.ai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${key}`
      }
    });
    const data = await res.json();
    console.log("Cerebras Models:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Failed to list Cerebras models:", e);
  }
}

testCerebras();
