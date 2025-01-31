import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const messages = await req.json();
    console.log("Received messages:", messages);

    const tools = [
      {
        type: "function" as const,
        function: {
          name: "search",
          description: "Search for information on the internet",
          parameters: {
            type: "object",
            properties: {},
          },
        },
      },
      {
        type: "function" as const,
        function: {
          name: "chat",
          description: "Have a conversation",
          parameters: {
            type: "object",
            properties: {},
          },
        },
      },
      // Add other tools here
    ];

    console.log("Creating OpenAI chat completion");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",  // Changed from gpt-4o-mini which doesn't exist
      messages: messages,
      tools: tools,
      tool_choice: "auto",
    });

    console.log("OpenAI response:", response);
    
    if (!response.choices[0].message) {
      console.log("No message in response, defaulting to chat mode");
      return NextResponse.json({ mode: "chat", arg: "" });
    }

    const toolCalls = response.choices[0].message.tool_calls;
    if (!toolCalls) {
      console.log("No tool calls found, defaulting to chat mode");
      return NextResponse.json({ mode: "chat", arg: "" });
    }

    const firstToolCall = toolCalls[0];
    return NextResponse.json({
      mode: firstToolCall.function.name,
      arg: firstToolCall.function.arguments,
    });

  } catch (error) {
    console.error("Detailed OpenAI error:", error);
    // Return chat mode as fallback with error details
    return NextResponse.json({ 
      mode: "chat", 
      arg: "", 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
}
