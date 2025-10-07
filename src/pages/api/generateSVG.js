// src/pages/api/generate-svg.js
import { OpenAI } from 'openai';

const ACCESS_TOKEN = import.meta.env.OR_TOKEN;
const BASE_URL = import.meta.env.LOCAL_URL;
export const POST = async ({ request }) => {
  console.log(request);

  const prompt  = await request.json();
  const client = new OpenAI({
    baseURL: BASE_URL,
    apiKey: ACCESS_TOKEN,
  });
  let SystemMessage = 
    {
      role: "system",
      content: "You are an SVG code generator. Generate SVG code for the following prompt. Make sure to include ids for each part of the generated SVG.",
    };
  console.log("Prompt:", prompt);
  console.log([SystemMessage, ...prompt]);
  

  const chatCompletion = await client.chat.completions.create({
    // model: "openai/gpt-oss-20b:free", //OR
    model: "openai/gpt-oss-20b", //LOCAL
    messages: [SystemMessage, ...prompt]
  });
  const message = chatCompletion.choices[0].message || "";
  // Extract the SVG content from the response using a regex
  console.log("Generated SVG:", message);
  
  // const svgMatch = message.content.match(/<svg[\s\S]*?<\/svg>/i);
  // message.content = svgMatch? svgMatch[0] : "";
  return new Response(JSON.stringify({ svg: message }), {
    headers: { "Content-Type": "application/json" },
  });
};