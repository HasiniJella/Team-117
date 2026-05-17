import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import type { ChatMessage, UserProfile, MedicalDocument, PeriodCycle, PeriodLog, AnalysisResult, HealthLog } from '../types';
import { SendIcon, SparklesIcon } from './icons';

interface DietChatbotProps {
    profile: UserProfile;
    documents: MedicalDocument[];
    periodCycles: PeriodCycle[];
    periodLogs: PeriodLog[];
    analysisResults: { [docId: string]: { analysis?: AnalysisResult; isLoading: boolean } };
    healthLogs: HealthLog[];
}

// A robust, safe component to render basic markdown from the AI.
// It processes line-by-line to avoid complex state and includes a try-catch fallback.
const SafeMarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    try {
        const lines = content.split('\n');
        
        return (
            <div> {/* Using a simple div to avoid prose styling conflicts */}
                {lines.map((line, index) => {
                    const trimmedLine = line.trim();

                    // Helper to render bold text (**text**)
                    const renderWithBold = (text: string) => {
                        const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);
                        return (
                            <>
                                {parts.map((part, i) =>
                                    part.startsWith('**') && part.endsWith('**') ?
                                    <strong key={i}>{part.slice(2, -2)}</strong> :
                                    part
                                )}
                            </>
                        );
                    };

                    if (trimmedLine.startsWith('## ')) {
                        return <h2 key={index} className="text-xl font-bold mt-4 mb-2">{renderWithBold(trimmedLine.substring(3))}</h2>;
                    }
                    if (trimmedLine.startsWith('### ')) {
                        return <h3 key={index} className="text-lg font-semibold mt-3 mb-1">{renderWithBold(trimmedLine.substring(4))}</h3>;
                    }
                    // Simulate a list item for safety, instead of trying to build a real <ul>
                    if (trimmedLine.startsWith('* ')) {
                        return <div key={index} className="flex items-start my-1"><span className="mr-2 mt-1">&#8226;</span><span>{renderWithBold(trimmedLine.substring(2))}</span></div>;
                    }
                    if (trimmedLine !== '') {
                        return <p key={index} className="my-1">{renderWithBold(line)}</p>;
                    }
                    // Render empty lines as a small vertical space
                    return <div key={index} className="h-4" />;
                })}
            </div>
        );
    } catch (error) {
        console.error("Markdown rendering error:", error);
        // Fallback to pre-formatted text if the renderer encounters an unexpected error
        return <pre className="whitespace-pre-wrap font-sans text-sm">{content}</pre>;
    }
};


export const DietChatbot: React.FC<DietChatbotProps> = ({ profile, documents, periodCycles, periodLogs, analysisResults, healthLogs }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [initialPlanGenerated, setInitialPlanGenerated] = useState(false);
  
  const systemInstruction = `You are a friendly, conversational AI nutritionist. Your primary goal is to provide a detailed, medically appropriate diet plan based on the user's comprehensive health data.

**Data to Analyze:**
- User Profile: age, gender, weight, height, BMI, health goals, allergies, conditions.
- Health Logs: recent blood pressure, heart rate, sleep, and reported symptoms.
- Period Tracker: average cycle length and common menstrual symptoms.
- Medical Documents: AI-generated summary of uploaded reports.

**Your Task:**
When asked to generate a diet plan, you MUST structure your response in readable Markdown format with the following sections:
1.  **Daily Calorie Target:** Estimate a daily calorie target. If activity level is missing, assume a lightly active lifestyle.
2.  **Meal Plan:** Provide a 1-day meal plan with 3-5 balanced meals (including portion guidance). Include Indian and global food options.
3.  **Key Recommendations:** Include hydration tips and a list of foods to limit or avoid based on the user's data.
4.  **Nutritional Rationale:** Briefly explain why certain foods were chosen in relation to the user's health data.

**Important Rules:**
- **Tone:** Be encouraging and conversational.
- **Scope:** Focus strictly on nutrition and lifestyle. You MUST AVOID medical diagnoses.
- **Missing Data:** If key data is missing, state that the plan is more general and recommend the user complete their profile, but still provide a helpful plan based on available information.
- **Encouragement:** End your diet plan response with a short, positive message like "Stay consistent—your health is improving!"`;


  useEffect(() => {
    const initChat = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        chatRef.current = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: systemInstruction,
          },
        });
        setMessages([
          { id: 'initial', text: 'Hello! I am your AI Diet Planner. I can create a personalized diet plan based on your profile, period data, and medical documents.', sender: 'ai' }
        ]);
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

  const periodStats = useMemo(() => {
    // Fix: Correctly sort cycles by comparing ISO date strings. Arithmetic operations cannot be performed on strings.
    const sortedCycles = [...periodCycles].sort((a,b) => a.startDate.localeCompare(b.startDate));
    let avgCycleLength: string | number = 'N/A';
    if (sortedCycles.length >= 2) {
        let cycleDurations = 0;
        for (let i = 0; i < sortedCycles.length - 1; i++) {
            const d1 = new Date(sortedCycles[i].startDate);
            const d2 = new Date(sortedCycles[i+1].startDate);
            cycleDurations += Math.ceil(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
        }
        avgCycleLength = Math.round(cycleDurations / (sortedCycles.length - 1));
    }

    const commonSymptoms = Object.entries(periodLogs.flatMap(log => log.symptoms).reduce((acc, symptom) => {
        acc[symptom] = (acc[symptom] || 0) + 1;
        return acc;
    }, {} as Record<string, number>)).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([name]) => name);

    return { avgCycleLength, commonSymptoms };
  }, [periodCycles, periodLogs]);

  const constructInitialPrompt = () => {
    const bmi = (profile.weight && profile.height) ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1) : 'N/A';
    const latestDocument = documents.length > 0 ? documents[0] : null;
    const latestAnalysis = latestDocument ? analysisResults[latestDocument.id]?.analysis : null;
    const documentSummary = latestAnalysis && !latestAnalysis.error ? latestAnalysis.summary : null;

    let prompt = `Please create a personalized 1-day diet plan for me based on the following comprehensive health data:
    
**User Profile:**
- Age: ${profile.age || 'Not specified'}
- Gender: ${profile.gender || 'Not specified'}
- Weight: ${profile.weight || 'N/A'} kg
- Height: ${profile.height || 'N/A'} cm
- BMI: ${bmi}
- Health Goals: ${profile.healthGoals || 'General wellness'}
- Known Allergies: ${profile.allergies || 'None specified'}
- Chronic Conditions: ${profile.conditions || 'None specified'}
- Current Medications: ${profile.medications || 'None specified'}`;
    
    if (healthLogs.length > 0) {
        prompt += `\n
**Recent Health Logs (last 3 entries):**`;
        healthLogs.slice(0, 3).forEach(log => {
            prompt += `\n- Date: ${new Date(log.date).toLocaleDateString()}`;
            if (log.heartRate) prompt += `, Heart Rate: ${log.heartRate} bpm`;
            if (log.systolicBP && log.diastolicBP) prompt += `, BP: ${log.systolicBP}/${log.diastolicBP} mmHg`;
            if (log.sleepHours) prompt += `, Sleep: ${log.sleepHours} hrs`;
            if (log.steps) prompt += `, Steps: ${log.steps}`;
            if (log.symptoms) prompt += `, Symptoms: "${log.symptoms}"`;
        });
    }
            
    if (periodCycles.length > 0) {
        prompt += `\n
**Menstrual Cycle Data:**
- Average Cycle Length: ${periodStats.avgCycleLength} days
- Common Symptoms: ${periodStats.commonSymptoms.join(', ') || 'None logged'}`;
    }

    if (documentSummary) {
        prompt += `\n
**Medical Document Summary:**
- ${documentSummary}`;
    }

    prompt += `\n\nPlease generate the plan now.`;
    return prompt;
  };
  
  const handleGeneratePlan = () => {
     handleSend(null, constructInitialPrompt());
     setInitialPlanGenerated(true);
  };

  const handleSend = async (e: React.FormEvent | null, promptOverride?: string) => {
    if(e) e.preventDefault();
    const messageToSend = promptOverride || input;
    if (!messageToSend.trim() || isLoading) return;

    if (!promptOverride) {
        const userMessage: ChatMessage = { id: Date.now().toString(), text: messageToSend, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
    }
    setInput('');
    setIsLoading(true);

    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMessageId, text: '', sender: 'ai', isLoading: true }]);

    try {
      if (!chatRef.current) throw new Error("Chat not initialized");
      
      const stream = await chatRef.current.sendMessageStream({ message: messageToSend });
      let fullResponse = '';

      for await (const chunk of stream) {
        fullResponse += chunk.text;
        setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, text: fullResponse, isLoading: true } : msg));
      }
      
      let cleanedResponse = fullResponse.trim();
      if (cleanedResponse.startsWith("```") && cleanedResponse.endsWith("```")) {
        cleanedResponse = cleanedResponse.substring(3, cleanedResponse.length - 3).trim();
        const firstLineEnd = cleanedResponse.indexOf('\n');
        if (firstLineEnd !== -1) {
            const firstLine = cleanedResponse.substring(0, firstLineEnd).trim();
            if (/^[a-z]+$/.test(firstLine)) { // simple check for 'json', 'markdown' etc.
                cleanedResponse = cleanedResponse.substring(firstLineEnd + 1).trim();
            }
        }
      }

      if (cleanedResponse.trim() === '') {
        const errorText = "I'm sorry, I was unable to generate a response for this request. This may be due to the AI's safety filters regarding the provided health data. Please try again, or adjust the information in your profile or documents.";
        setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, text: errorText, isLoading: false } : msg));
      } else {
        setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, text: cleanedResponse, isLoading: false } : msg));
      }
    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      const errorText = "I'm sorry, an error occurred while connecting to the AI service. Please check your connection and try again.";
      setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, text: errorText, isLoading: false } : msg));
    } finally {
      setIsLoading(false);
    }
  };
  
  const isReady = profile.weight && profile.height;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] bg-white dark:bg-slate-800 rounded-xl shadow-md">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 p-4 border-b border-slate-200 dark:border-slate-700">AI Diet Planner</h1>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-white"/></div>}
            <div className={`max-w-xs md:max-w-md lg:max-w-2xl px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-violet-600 text-white rounded-br-none' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
              {msg.sender === 'ai' ? <SafeMarkdownRenderer content={msg.text} /> : <p className="whitespace-pre-wrap">{msg.text}</p>}
              {msg.isLoading && <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse mt-2"></div>}
            </div>
          </div>
        ))}
        {!initialPlanGenerated && isReady && (
            <div className="text-center p-4">
                 <button
                    onClick={handleGeneratePlan}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 disabled:bg-slate-400 transition-colors"
                >
                    <SparklesIcon className="h-5 w-5" />
                    <span>Generate My Diet Plan</span>
                </button>
            </div>
        )}
         {!isReady && (
            <div className="text-center p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <p className="text-slate-600 dark:text-slate-300">Please add your weight and height in your profile to enable the diet planner.</p>
            </div>
         )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className={`p-4 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 ${!initialPlanGenerated ? 'hidden' : ''}`}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for adjustments or alternatives..."
          className="flex-1 w-full px-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400"
          disabled={isLoading || !initialPlanGenerated}
        />
        <button type="submit" className="bg-violet-600 text-white rounded-full p-3 hover:bg-violet-700 disabled:bg-slate-400" disabled={isLoading || !input.trim()}>
          <SendIcon className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};