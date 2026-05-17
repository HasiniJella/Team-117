import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import type { ChatMessage } from '../types';
import { SendIcon } from './icons';

export const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'initial', text: 'Hello! I am your AI Health Guide. How can I help you today? Remember, I am not a medical professional. Please consult a doctor for medical advice.', sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        chatRef.current = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: 'You are a helpful and friendly AI assistant providing general health, fitness, and diet guidance. You are not a medical professional. Your tone should be encouraging and informative. Keep your answers concise and to the point, like a chat assistant. Use short paragraphs or bullet points. Always include a disclaimer to consult with a healthcare professional for medical advice.',
          },
        });
      } catch (error) {
        console.error("Failed to initialize Gemini chat:", error);
        setMessages(prev => [...prev, { id: 'error-init', text: 'Sorry, I am unable to connect right now. Please check your API key and refresh the page.', sender: 'ai' }]);
      }
    };
    initChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMessageId, text: '', sender: 'ai', isLoading: true }]);

    try {
      if (!chatRef.current) {
        throw new Error("Chat not initialized");
      }
      
      const stream = await chatRef.current.sendMessageStream({ message: input });
      let fullResponse = '';

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        fullResponse += chunkText;
        setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, text: fullResponse, isLoading: true } : msg));
      }
      
       setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, isLoading: false } : msg));

    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      const errorText = "I'm sorry, but I encountered an error. Please try again later.";
      setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, text: errorText, isLoading: false } : msg));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] bg-white dark:bg-slate-800 rounded-xl shadow-md">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 p-4 border-b border-slate-200 dark:border-slate-700">AI Health Guide</h1>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-violet-500 flex-shrink-0"></div>}
            <div className={`max-w-xs md:max-w-md lg:max-w-2xl px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-violet-600 text-white rounded-br-none' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
              {msg.isLoading && <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse mt-2"></div>}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about diet, exercise, or symptoms..."
          className="flex-1 w-full px-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400"
          disabled={isLoading}
        />
        <button type="submit" className="bg-violet-600 text-white rounded-full p-3 hover:bg-violet-700 disabled:bg-slate-400" disabled={isLoading || !input.trim()}>
          <SendIcon className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};