import { OpenAI } from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";


const HF_TOKEN = import.meta.env.PUBLIC_HF_TOKEN;

const client = new OpenAI({
	baseURL: "https://router.huggingface.co/v1",
	apiKey: HF_TOKEN,
    dangerouslyAllowBrowser: true
});

const SVGOutput = z.object({
  message: z.string(),
  SVGCode: z.string(),
});

export async function generateSVG(prompt) {
    console.log(HF_TOKEN);
    console.log('generating: ', prompt);
	const chatCompletion = await client.chat.completions.create({
		model: "meta-llama/Llama-3.1-8B-Instruct",
        // model: "deepseek-ai/DeepSeek-V3.1",
		messages: [
            {
                role: "system", 
                content: "You are an SVG code generator. Generate SVG code for the following prompt: " + prompt
            },
			{
				role: "user",
				content: prompt,
            
			},
		],
	});
    console.log('chatCompletion: ', chatCompletion);
    const svgCode = chatCompletion.choices[0].message.content.match(/<svg[\s\S]*<\/svg>/);
    return svgCode ? svgCode[0] : "No SVG code found.";
}

// export async function generateSVG(prompt) {
//     console.log(HF_TOKEN);
//     console.log('generating: ', prompt);
// 	const r = await client.responses.parse({
// 		model: "deepseek-ai/DeepSeek-V3.1:novita",
// 		messages: [
//             {
//                 role: "system", 
//                 content: "You are an SVG code generator. Generate SVG code for the following prompt: " + prompt
//             },
// 			{
// 				role: "user",
// 				content: prompt,
            
// 			},
// 		],
//         text: {
//             format: zodTextFormat(SVGOutput, "svg"),
//         },
// 	});
//     console.log('chatCompletion: ', r.output_parsed);

// 	return r.output_parsed;
// }


