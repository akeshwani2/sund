import { Message } from "@/utils/types";

export const queryRequiresGmail = (
  question: string,
  mode?: string
): boolean => {
  if (mode === "gmail") return true;
  const emailKeywords = ["email", "emails", "inbox", "message", "messages", "mail", "send", "draft", "save for later"];
  return emailKeywords.some((keyword) =>
    question.toLowerCase().includes(keyword)
  );
};

export const createGmailContextMessages = (
  emails: any[],
  question: string
): Message[] => {
  // Add error handling for invalid email structure
  if (!Array.isArray(emails)) {
    console.error("Invalid emails format:", emails);
    return [{ role: "user", content: question }];
  }

  const emailContext = emails
    .slice(0, 50)
    .map((email) => {
      const headers = email.payload?.headers || [];
      const date = new Date(parseInt(email.internalDate));
      const formattedDate = date.toLocaleString();
      return `From: ${
        headers.find((h: any) => h.name === "From")?.value || "Unknown"
      }\nSubject: ${
        headers.find((h: any) => h.name === "Subject")?.value || "No Subject"
      }
      \nSnippet: ${email.snippet || ""}.\nAt: ${formattedDate}`;
    })
    .join("\n\n");

  return [
    {
      role: "system",
      content: `You are helping the user with their Gmail. Here are their recent emails:\n${emailContext}, please use this information to answer the user's question, summarising the emails as much as possible, and format it neatly. Add a 1 line summary of the email at the end of each email, provide the time of the email in the summary, and use a new line to separate each line.
      1. Focus on the most relevant emails
      2. Summarize key points briefly
      3. Mention senders and dates
      4. Keep responses under 200 words
      5. Use bullet points for clarity
      6. Highlight urgent items first

When creating email drafts or sending emails, format the JSON like this:
\`\`\`terminal
DRAFT_CONTENT: {
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "body": "Email content here..."
}
\`\`\`
Or for sending:
\`\`\`terminal
SEND_CONTENT: {
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "body": "Email content here..."
}
\`\`\`
The JSON must be the last part of your response. Never mention the JSON structure to the user.
Priority rules:
1. If user says "send" and "email" together, ALWAYS use SEND_CONTENT
2. Only use DRAFT_CONTENT if user explicitly says "draft" or "save for later"
3. When unsure, ask user to clarify if they want to send or draft`,
    },
    { role: "user", content: question },
  ];
};
