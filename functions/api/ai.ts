
export async function onRequestPost({ request, env }: { request: Request, env: any }) {
  try {
    const { messages, tier, options } = await request.json() as any;
    
    // 1. Collect Keys from Cloudflare Secrets
    const groqKeys = [
      env.VITE_GROQ_API_KEY || env.GROQ_API_KEY,
      env.VITE_GROQ_API_KEY_2,
      env.VITE_GROQ_API_KEY_3,
      env.VITE_GROQ_API_KEY_4,
      env.VITE_GROQ_API_KEY_5,
      env.VITE_GROQ_API_KEY_6
    ].filter(Boolean);

    const geminiKeys = [
      env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY,
      env.VITE_GEMINI_API_KEY_2,
      env.VITE_GEMINI_API_KEY_3,
      env.VITE_GEMINI_API_KEY_4,
      env.VITE_GEMINI_API_KEY_5,
      env.VITE_GEMINI_API_KEY_6
    ].filter(Boolean);

    // 2. Simple Server-Side Rotation (Stateless)
    // We pick a pseudo-random key to load balance across the 6-key pool
    const getRotatedKey = (keys: string[]) => keys[Math.floor(Math.random() * keys.length)];

    // 3. Forward to appropriate provider based on tier
    // For simplicity in the Edge Worker, we'll use direct fetch calls
    const provider = messages.some((m: any) => m.role === 'image') ? 'gemini' : (tier === 'T5' ? 'groq' : 'groq');
    
    if (provider === 'groq') {
      const key = getRotatedKey(groqKeys);
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options?.model || 'llama-3.3-70b-versatile',
          messages,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.max_tokens || 2048,
          stream: false // Cloudflare Workers support streaming but easier to start with non-stream
        })
      });
      return new Response(response.body, response);
    } else {
      const key = getRotatedKey(geminiKeys);
      const systemMsg = messages.find((m: any) => m.role === 'system')?.content || '';
      const userMsg = messages.find((m: any) => m.role === 'user')?.content || '';
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${options?.model || 'gemini-2.5-flash'}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `${systemMsg}\n\n${userMsg}` }] }],
          generationConfig: {
            temperature: options?.temperature || 0.1,
            maxOutputTokens: options?.maxOutputTokens || 8192
          }
        })
      });
      return new Response(response.body, response);
    }

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
