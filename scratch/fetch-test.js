import 'dotenv/config';

async function listGeminiModels() {
  const key = process.env.VITE_GEMINI_API_KEY_5;
  if (!key) return;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    if (res.ok) {
      const data = await res.json();
      console.log('Gemini models:', data.models.map(m => m.name.replace('models/', '')));
    } else {
      console.log('Gemini models failed:', res.status, await res.text());
    }
  } catch (e) {
    console.log('Gemini models error:', e.message);
  }
}

listGeminiModels().catch(console.error);
