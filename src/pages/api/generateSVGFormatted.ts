// src/pages/api/generate-svg.ts
import type { APIRoute } from 'astro';
import { OpenAI } from 'openai';

const HF_TOKEN = import.meta.env.PUBLIC_HF_TOKEN;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { prompt } = await request.json();
    console.log('Prompt received:', prompt);

    const client = new OpenAI({
      baseURL: import.meta.env.PUBLIC_LLAMA_URL,
      apiKey: HF_TOKEN,
    });

    // Ask the model to return ONLY JSON
    const response = await client.chat.completions.create({
      model: "codellama",
      messages: [
        {
          role: "system",
          content: "You are an SVG generator. Respond ONLY with valid JSON in the format: { \"message\": string, \"SVGCode\": string }"
        },
        { role: "user", content: prompt }
      ],
    });

    const rawOutput = response.choices[0].message?.content || "";
    console.log('Raw model output:', rawOutput);

    // Remove Markdown backticks if present
    const cleaned = rawOutput.replace(/^```json\s*|```$/g, '').trim();

    // Parse JSON safely
    const parsed = JSON.parse(cleaned);

    return new Response(JSON.stringify({ svg: parsed.SVGCode || "" }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error('Error generating SVG:', e);
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
