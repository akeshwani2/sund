export const handleMode = async (text: string) => {
  try {
    console.log("Sending request to /api/tools with text:", text);
    const response = await fetch("/api/tools", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify([
        {
          role: "system",
          content: "You are an AI Assistant named Sunday who determines the appropriate function to use based on user queries."
        },
        { role: "user", content: text }
      ]),
    });
    
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return { mode: "chat", arg: "" };
    }
    
    const data = await response.json();
    console.log("Received mode data:", data);
    
    if (data.error) {
      console.error("Server reported error:", data.error);
      return { mode: "chat", arg: "" };
    }

    return { 
      mode: data.mode || "chat", 
      arg: data.arg || "" 
    };
  } catch (error) {
    console.error("Error in handleMode:", error);
    return { mode: "chat", arg: "" };
  }
};
