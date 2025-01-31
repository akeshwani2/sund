export const handleMode = async (text: string) => {
  try {
    console.log("Sending request to /api/tools");
    const response = await fetch("/api/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([
        {
          role: "system",
          content:
            "You are an Ai Asistant named Sunday who is supposed to use functions or chat based on the user query." +
            "If the user wants to search for information, use search function." +
            "If the user wants to get stock information, use stock function." +
            "If the user wants to get weather information, use weather function." +
            "If the user wants to get dictionary information, use dictionary function." +
            "If the user asks who you are, you are an AI assistant named Sunday.",
        },
        { role: "user", content: text },
      ]),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Mode and arguments:", data);
    return { mode: data.mode, arg: data.arg };
  } catch (error) {
    console.error("Error in handleMode:", error);
    // Fallback to chat mode if there's an error
    return { mode: "chat", arg: "" };
  }
};
