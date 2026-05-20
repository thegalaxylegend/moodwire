import 'dotenv/config';

async function main() {
  const apiKey = process.env.CEREBRAS_API_KEY || process.env.VITE_CEREBRAS_API_KEY;
  if (!apiKey) {
    console.error("CEREBRAS_API_KEY not found");
    return;
  }

  const res = await fetch('https://api.cerebras.ai/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!res.ok) {
    console.error("Failed to fetch models:", res.statusText);
    return;
  }

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

main();
