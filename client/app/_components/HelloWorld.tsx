"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface Message {
  text: string;
  isUser: boolean;
}

export default function HelloWorld() {
  const [isConfigured, setIsConfigured] = useState<boolean>(
    !!process.env.NEXT_PUBLIC_API_URL
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setIsConfigured(!!process.env.NEXT_PUBLIC_API_URL);
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);

    try {
      const response = await axios.post("/api/chat/eliza", { message: userMessage });
      setMessages(prev => [...prev, { text: response.data.response, isUser: false }]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Chat with Eliza</h1>
      
      {!isConfigured ? (
        <span>
          API URL not configured properly, type Ctrl+C and then type{" "}
          <span className="text-blue-500">
            <b>pnpm run dev</b>
          </span>{" "}
          in the terminal
        </span>
      ) : (
        <>
          <div className="w-full h-[400px] border rounded-lg p-4 mb-4 overflow-y-auto">
            {messages.map((message, index) => {
              let messageText = <div>{message.text}</div>

              // check if message contains nuggets deeplink
              if (message.text.match(/ class="nuggets-deeplink"/)) {
                messageText = <div dangerouslySetInnerHTML={{ __html: message.text }}></div>
              }

              return (
                <div
                  key={index}
                  className={`mb-2 ${
                    message.isUser ? "text-right" : "text-left"
                  }`}
                >
                  <span
                    className={`inline-block p-2 rounded-lg ${
                      message.isUser
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-black"
                    }`}
                  >
                    {messageText}
                  </span>
                </div>
              )
            })}
          </div>

          <form onSubmit={sendMessage} className="w-full flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 p-2 border rounded text-black"
              placeholder="Type your message..."
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Send
            </button>
          </form>

          {error && (
            <div className="text-red-500 mt-2">Error: {error}</div>
          )}
        </>
      )}
    </div>
  );
}
