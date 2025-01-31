import { useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateAnswer,
  addMessage,
  updateMessage,
  selectChatThread,
} from "@/store/chatSlice";
import { Chat as ChatType, ChatThread, Message } from "../utils/types";
import { getInitialMessages } from "../utils/utils";
import { selectUserDetailsState } from "@/store/authSlice";
import { selectAI } from "@/store/aiSlice";
import { store } from "@/store/store";
import { doc, updateDoc, getDoc } from "@firebase/firestore";
import { db } from "../../firebaseConfig";
import { GmailService } from "@/lib/Gmail";
import { queryRequiresGmail, createGmailContextMessages } from "@/utils/gmailHelpers";

type UseChatAnswerProps = {
  threadId: string;
  chatThread: ChatThread;
  setError: (error: string) => void;
  setErrorFunction: (fn: Function | null) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsCompleted: (isCompleted: boolean) => void;
};

const useChatAnswer = ({
  threadId,
  chatThread,
  setError,
  setErrorFunction,
  setIsStreaming,
  setIsLoading,
  setIsCompleted,
}: UseChatAnswerProps) => {
  const dispatch = useDispatch();
  const userDetails = useSelector(selectUserDetailsState);
  const ai = useSelector(selectAI);
  const userId = userDetails.uid;

  const controller = useRef<AbortController | null>(null);

  const handleSave = async () => {
    if (userId) {
      try {
        const updatedState = store.getState();
        const updatedChatThread = selectChatThread(updatedState, threadId);
        const updatedChats = updatedChatThread?.chats || [];
        const updatedMessages = updatedChatThread?.messages || [];
        if (userId) {
          try {
            const chatThreadRef = doc(db, "users", userId, "history", threadId);
            await updateDoc(chatThreadRef, {
              messages: updatedMessages,
              chats: updatedChats,
            });
          } catch (error) {
            console.error("Error updating chat thread in Firestore:", error);
          }
        }
      } catch (error) {
        console.error("Error updating Firestore DB:", error);
      }
    }
  };

  const handleAnswer = async (chat: ChatType, context?: string, chatHistory?: any[]) => {
    setIsLoading(true);
    setIsCompleted(false);
    setIsStreaming(true);

    // Create new controller for this request
    controller.current = new AbortController();

    let messages = chatThread.messages;
    
    if (messages.length === 0) {
      messages = getInitialMessages(chat, context);
    } else {
      messages = [...messages, { role: "user", content: chat.question }];
    }

    if (queryRequiresGmail(chat.question)) {
      const gmailDoc = await getDoc(doc(db, 'users', userId, 'integrations', 'gmail'));
      if (gmailDoc.exists()) {
        try {
          const gmail = new GmailService(gmailDoc.data().accessToken);
          const emailResponse = await gmail.getRecentEmails(500, "");
          
          if (!emailResponse || emailResponse.length === 0) {
            setError('No emails found');
            return;
          }
          
          messages = createGmailContextMessages(emailResponse, chat.question);
        } catch (error) {
          console.error('Gmail fetch failed:', error);
          setError('Failed to access Gmail - please reconnect');
          return;
        }
      }
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages,
          model: chat?.mode === "image" ? "gpt-4o" : ai.model,
          temperature: ai.temperature,
          max_tokens: ai.maxLength,
          top_p: ai.topP,
          frequency_penalty: ai.frequency,
          presence_penalty: ai.presence,
        }),
        signal: controller.current.signal,
      });

      if (!response.ok) {
        setError("Something went wrong. Please try again later.");
        setErrorFunction(() => handleAnswer.bind(null, chat, context, chatHistory));
        return;
      }

      setIsLoading(false);
      if (response.body) {
        setError("");
        setIsStreaming(true);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let answer = "";
        while (true) {
          const { value, done } = await reader.read();
          const text = decoder.decode(value);
          answer += text;
          dispatch(
            updateAnswer({
              threadId,
              chatIndex: chatThread.chats.length - 1,
              answer: answer,
            })
          );
          if (done) {
            break;
          }
        }
        dispatch(
          addMessage({
            threadId,
            message: { role: "assistant", content: answer },
          })
        );
        setIsStreaming(false);
        setIsCompleted(true);
        handleSave();

        const hasDraft = answer.includes('DRAFT_CONTENT');
        const hasSend = answer.includes('SEND_CONTENT');

        if (hasDraft) {
          try {
            const draftMatch = answer.match(/DRAFT_CONTENT:\s*(\{[\s\S]*?\})/);
            if (draftMatch) {
              const gmailDoc = await getDoc(doc(db, 'users', userId, 'integrations', 'gmail'));
              if (gmailDoc.exists()) {
                const gmail = new GmailService(gmailDoc.data().accessToken);
                const draftContent = JSON.parse(draftMatch[1]);
                
                await gmail.createDraft(
                  draftContent.to,
                  draftContent.subject,
                  draftContent.body
                );
                
                answer += `\n\nDraft has been created in Gmail!`;
                dispatch(updateAnswer({
                  threadId,
                  chatIndex: chatThread.chats.length - 1,
                  answer: answer
                }));
              }
            }
          } catch (error) {
            console.error('Draft creation failed:', error);
            answer += "\n\n⚠️ Failed to create draft - please check Gmail connection";
            dispatch(updateAnswer({
              threadId,
              chatIndex: chatThread.chats.length - 1,
              answer: answer
            }));
          }
        }

        if (hasSend) {
          try {
            const sendMatch = answer.match(/SEND_CONTENT:\s*(\{[\s\S]*?\})/);
            if (sendMatch) {
              const gmailDoc = await getDoc(doc(db, 'users', userId, 'integrations', 'gmail'));
              if (gmailDoc.exists()) {
                const gmail = new GmailService(gmailDoc.data().accessToken);
                const sendContent = JSON.parse(sendMatch[1]);
                
                await gmail.sendEmail(
                  sendContent.to,
                  sendContent.subject,
                  sendContent.body
                );
                
                answer += `\n\nEmail has been sent successfully!`;
                dispatch(updateAnswer({
                  threadId,
                  chatIndex: chatThread.chats.length - 1,
                  answer: answer
                }));
              }
            }
          } catch (error) {
            console.error('Email send failed:', error);
            answer += "\n\n⚠️ Failed to send email - please check Gmail connection";
            dispatch(updateAnswer({
              threadId,
              chatIndex: chatThread.chats.length - 1,
              answer: answer
            }));
          }
        }
      }
    } catch (error) {
      setIsLoading(false);
      setIsStreaming(false);
      setIsCompleted(true);
      if ((error as Error).name === "AbortError") {
        await handleSave();
        return;
      }
      setError("Something went wrong. Please try again later.");
      setErrorFunction(() => handleAnswer.bind(null, chat, context, chatHistory));
    } finally {
      controller.current = null;
    }
  };

  const handleRewrite = async () => {
    setIsLoading(true);
    setIsCompleted(false);
    const newController = new AbortController();
    controller.current = newController;

    const lastChat = chatThread.chats[chatThread.chats.length - 1];
    const lastUserMessage = chatThread.messages.findLast(
      (message) => message.role === "user"
    );

    if (!lastChat.answer) {
      return;
    }

    const messages: Message[] = [];
    const systemMessage = chatThread.messages.find(
      (message) => message.role === "system"
    );
    if (systemMessage) {
      messages.push(systemMessage);
    }

    // Add all previous messages to maintain context
    messages.push(...chatThread.messages.filter(msg => 
      msg.role !== "system" && 
      msg !== lastUserMessage && 
      msg.content !== lastChat.answer
    ));

    // Add the last user message
    messages.push({
      role: "user",
      content: lastUserMessage?.content ?? lastChat.question,
    });

    if (ai.customPrompt.length > 0) {
      messages.push({
        role: "system",
        content: ai.customPrompt,
      });
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages,
          model: lastChat.mode === "image" ? "gpt-4o" : ai.model,
          temperature: ai.temperature,
          max_tokens: ai.maxLength,
          top_p: ai.topP,
          frequency_penalty: ai.frequency,
          presence_penalty: ai.presence,
        }),
        signal: newController.signal,
      });

      if (!response.ok) {
        setError("Something went wrong. Please try again later.");
        setErrorFunction(() => handleRewrite);
        return;
      }

      setIsLoading(false);
      if (response.body) {
        setError("");
        setIsStreaming(true);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let answer = "";
        while (true) {
          const { value, done } = await reader.read();
          const text = decoder.decode(value);
          answer += text;
          dispatch(
            updateAnswer({
              threadId,
              chatIndex: chatThread.chats.length - 1,
              answer: answer,
            })
          );
          if (done) {
            break;
          }
        }
        dispatch(
          addMessage({
            threadId,
            message: { role: "assistant", content: answer },
          })
        );
        setIsStreaming(false);
        setIsCompleted(true);
        handleSave();
      }
    } catch (error) {
      setIsLoading(false);
      setIsStreaming(false);
      setIsCompleted(true);
      if ((error as Error).name === "AbortError") {
        await handleSave();
        return;
      }
      setError("Something went wrong. Please try again later.");
      setErrorFunction(() => handleRewrite);
    } finally {
      controller.current = null;
    }
  };

  const handleCancel = useCallback(() => {
    if (controller.current) {
      controller.current.abort();
      controller.current = null;
    }
  }, []);

  return {
    handleAnswer,
    handleRewrite,
    handleCancel,
  };
};

export default useChatAnswer;
