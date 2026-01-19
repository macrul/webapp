import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, AlertTriangle, Users, MapPin, Scroll, Eraser } from 'lucide-react';
import { Message, Campaign } from '../types';
import { INITIAL_GREETING, PLAYER_GREETING } from '../constants';
import { sendMessageToGemini } from '../services/geminiService';
import { ChatMessage } from './ChatMessage';

interface AIChatProps {
  campaign: Campaign;
  onUpdateCampaign: (updatedCampaign: Campaign) => void;
}

const useAutoScroll = (dependencies: any[]) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, dependencies);
  return bottomRef;
};

export const AIChat: React.FC<AIChatProps> = ({ campaign, onUpdateCampaign }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const defaultGreeting = campaign.isAiDm ? PLAYER_GREETING : INITIAL_GREETING;
  const messages = campaign.aiChatHistory || [{ id: 'init', role: 'model', content: defaultGreeting, timestamp: Date.now() }];
  
  const bottomRef = useAutoScroll([messages]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const updateHistory = (newMessages: Message[]) => {
    onUpdateCampaign({
      ...campaign,
      aiChatHistory: newMessages
    });
  };

  const handleSend = useCallback(async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const updatedHistory = [...messages, userMsg];
    updateHistory(updatedHistory);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(updatedHistory, text);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: Date.now(),
      };
      updateHistory([...updatedHistory, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, isLoading, messages, campaign]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePanic = () => {
    handleSend("panic! help fix story broken");
  };

  const handleQuickAction = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <div className="flex flex-col h-full bg-fantasy-900 relative">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth pb-24">
        <div className="max-w-3xl mx-auto">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          
          {isLoading && (
            <div className="flex justify-start mb-6">
              <div className="flex items-center gap-2 bg-fantasy-800 px-4 py-3 rounded-2xl rounded-tl-sm border border-fantasy-700">
                <Sparkles className="w-4 h-4 text-fantasy-accent animate-spin" />
                <span className="text-fantasy-muted text-sm italic">Consulting the archives...</span>
              </div>
            </div>
          )}
          
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Floating Panic Button */}
      <div className="absolute top-4 right-4 z-10">
         <button 
          onClick={handlePanic}
          className="bg-red-900/80 hover:bg-red-900 text-red-400 border border-red-500/50 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-xs font-bold shadow-lg backdrop-blur-sm"
        >
          <AlertTriangle size={14} />
          <span>PANIC</span>
        </button>
      </div>

      <div className="flex-shrink-0 bg-fantasy-900 border-t border-fantasy-700 py-2 overflow-x-auto">
         <div className="max-w-3xl mx-auto px-4 flex gap-2">
            <QuickBtn icon={<Users size={14}/>} label="New NPC" onClick={() => handleQuickAction("Generate a random NPC card")} />
            <QuickBtn icon={<MapPin size={14}/>} label="New Location" onClick={() => handleQuickAction("Generate a random Location card")} />
            <QuickBtn icon={<Scroll size={14}/>} label="Quest Hook" onClick={() => handleQuickAction("Give me a Quest card")} />
            <QuickBtn icon={<Eraser size={14}/>} label="Clear Chat" onClick={() => {
              if (window.confirm("Clear chat history?")) {
                const greeting = campaign.isAiDm ? PLAYER_GREETING : INITIAL_GREETING;
                updateHistory([{ id: 'init', role: 'model', content: greeting, timestamp: Date.now() }]);
              }
            }} />
         </div>
      </div>

      <footer className="flex-shrink-0 bg-fantasy-800 p-4 border-t border-fantasy-700">
        <div className="max-w-3xl mx-auto relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Co-Pilot for help..."
            className="w-full bg-fantasy-900 text-white rounded-xl pl-4 pr-12 py-3 border border-fantasy-700 focus:border-fantasy-accent focus:ring-1 focus:ring-fantasy-accent outline-none resize-none h-[52px] max-h-32 shadow-inner"
            rows={1}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1.5 p-2 bg-fantasy-accent text-fantasy-900 rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
};

const QuickBtn = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-1.5 px-3 py-1.5 bg-fantasy-700/50 hover:bg-fantasy-700 text-fantasy-text text-xs rounded-full border border-fantasy-600 transition-colors whitespace-nowrap"
  >
    {icon}
    <span>{label}</span>
  </button>
);