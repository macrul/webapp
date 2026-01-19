import React, { useState, useRef, useEffect } from 'react';
import { Campaign, PlayerMessage } from '../types';
import { MessageSquare, Users, Send, Dice5, Image as ImageIcon, Sparkles, Loader2, Video } from 'lucide-react';
import { generateGameImage, getAiDmResponse } from '../services/geminiService';

interface PlayerChatProps {
  campaign: Campaign;
  onUpdateCampaign: (updatedCampaign: Campaign) => void;
}

const DiceIcon = ({ sides }: { sides: number }) => {
  const commonClasses = "fill-fantasy-800 stroke-fantasy-muted stroke-2 group-hover:stroke-fantasy-accent group-hover:fill-fantasy-700 transition-all";
  
  switch(sides) {
    case 4:
      return (
        <svg viewBox="0 0 24 24" className="w-8 h-8">
           <path d="M12 2L22 22H2L12 2Z" className={commonClasses} />
           <text x="12" y="17" textAnchor="middle" fontSize="6" fill="currentColor" className="text-fantasy-text font-bold">D4</text>
        </svg>
      );
    case 6:
      return (
        <svg viewBox="0 0 24 24" className="w-8 h-8">
           <rect x="4" y="4" width="16" height="16" rx="2" className={commonClasses} />
           <text x="12" y="14" textAnchor="middle" fontSize="6" fill="currentColor" className="text-fantasy-text font-bold">D6</text>
        </svg>
      );
    case 8:
      return (
        <svg viewBox="0 0 24 24" className="w-8 h-8">
           <path d="M12 2L22 12L12 22L2 12L12 2Z" className={commonClasses} />
           <text x="12" y="14" textAnchor="middle" fontSize="6" fill="currentColor" className="text-fantasy-text font-bold">D8</text>
        </svg>
      );
    case 10:
      return (
        <svg viewBox="0 0 24 24" className="w-8 h-8">
           <path d="M12 2L22 10L12 22L2 10L12 2Z" className={commonClasses} />
           <path d="M2 10L22 10" className="stroke-fantasy-900/20 stroke-1 pointer-events-none" />
           <text x="12" y="14" textAnchor="middle" fontSize="6" fill="currentColor" className="text-fantasy-text font-bold">D10</text>
        </svg>
      );
    case 12:
      return (
        <svg viewBox="0 0 24 24" className="w-8 h-8">
           <path d="M12 2L21.5 9L17.9 20.1H6.1L2.5 9L12 2Z" className={commonClasses} />
           <text x="12" y="14" textAnchor="middle" fontSize="6" fill="currentColor" className="text-fantasy-text font-bold">D12</text>
        </svg>
      );
    case 20:
      return (
        <svg viewBox="0 0 24 24" className="w-8 h-8">
           <path d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z" className={commonClasses} />
           <text x="12" y="14" textAnchor="middle" fontSize="6" fill="currentColor" className="text-fantasy-text font-bold">D20</text>
        </svg>
      );
    default:
      return <Dice5 size={24} />;
  }
};

const DiceButton = ({ label, sides, onClick }: { label: string, sides: number, onClick: (s: number) => void }) => (
  <button 
    onClick={() => onClick(sides)}
    className="flex flex-col items-center justify-center p-1 rounded-lg hover:bg-fantasy-800 transition-all group scale-100 hover:scale-110 active:scale-95"
    title={`Roll D${sides}`}
  >
    <DiceIcon sides={sides} />
  </button>
);

export const PlayerChat: React.FC<PlayerChatProps> = ({ campaign, onUpdateCampaign }) => {
  const [input, setInput] = useState('');
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [showImgPrompt, setShowImgPrompt] = useState(false);
  const [imgPrompt, setImgPrompt] = useState('');
  const [aiTyping, setAiTyping] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [campaign.playerChat, aiTyping]);

  const addMessage = (msg: PlayerMessage) => {
    onUpdateCampaign({
      ...campaign,
      playerChat: [...campaign.playerChat, msg]
    });
  };

  const handleDMDiceRoll = (sides: number) => {
    const result = Math.floor(Math.random() * sides) + 1;
    const msg: PlayerMessage = {
      id: Date.now().toString(),
      senderId: campaign.isAiDm ? 'user' : 'dm',
      senderName: campaign.isAiDm ? 'You' : 'DM (You)',
      content: `Rolled D${sides}:`,
      timestamp: Date.now(),
      isRoll: true,
      rollResult: {
        total: result,
        formula: `1d${sides}`
      }
    };
    addMessage(msg);

    // If AI DM is on, AI might react to the roll
    if (campaign.isAiDm) {
      triggerAiDm([...campaign.playerChat, msg]);
    }
  };

  const handleRequestRoll = (checkType: string) => {
    const reqId = Date.now();
    const dmMsg: PlayerMessage = {
      id: reqId.toString(),
      senderId: campaign.isAiDm ? 'user' : 'dm',
      senderName: campaign.isAiDm ? 'You' : 'DM (You)',
      content: `I am rolling for ${checkType}`,
      timestamp: reqId,
    };
    
    // In AI DM mode, this is the user announcing a roll
    const updatedChat = [...campaign.playerChat, dmMsg];
    onUpdateCampaign({ ...campaign, playerChat: updatedChat });

    // Simulate dice roll result for the user instantly for UX
    const d20 = Math.floor(Math.random() * 20) + 1;
    const resultMsg: PlayerMessage = {
       id: (reqId + 1).toString(),
       senderId: campaign.isAiDm ? 'user' : 'dm',
       senderName: campaign.isAiDm ? 'You' : 'DM (You)',
       content: `Result for ${checkType}:`,
       timestamp: reqId + 100,
       isRoll: true,
       rollResult: { total: d20, formula: '1d20' }
    };

    const finalChat = [...updatedChat, resultMsg];
    
    // Add result after short delay
    setTimeout(() => {
       onUpdateCampaign({ ...campaign, playerChat: finalChat });
       if (campaign.isAiDm) triggerAiDm(finalChat);
    }, 500);
  };

  const triggerAiDm = async (currentHistory: PlayerMessage[]) => {
    setAiTyping(true);
    try {
      const response = await getAiDmResponse(currentHistory, campaign.description);
      const aiMsg: PlayerMessage = {
        id: Date.now().toString(),
        senderId: 'ai-dm',
        senderName: 'Dungeon Master',
        content: response,
        timestamp: Date.now()
      };
      onUpdateCampaign({
        ...campaign,
        playerChat: [...currentHistory, aiMsg]
      });
    } catch (e) {
      console.error(e);
    } finally {
      setAiTyping(false);
    }
  };

  const handleStartMeet = () => {
    const msg: PlayerMessage = {
      id: Date.now().toString(),
      senderId: campaign.isAiDm ? 'user' : 'dm',
      senderName: campaign.isAiDm ? 'You' : 'DM (You)',
      content: "I've started a video meeting for the party. Click to join!",
      timestamp: Date.now(),
      // In a real app, this would contain a link
    };
    addMessage(msg);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const msg: PlayerMessage = {
      id: Date.now().toString(),
      senderId: campaign.isAiDm ? 'user' : 'dm',
      senderName: campaign.isAiDm ? 'You' : 'DM (You)',
      content: input,
      timestamp: Date.now()
    };

    const newHistory = [...campaign.playerChat, msg];
    onUpdateCampaign({
      ...campaign,
      playerChat: newHistory
    });
    setInput('');

    if (campaign.isAiDm) {
      triggerAiDm(newHistory);
    }
  };

  const handleGenerateImage = async () => {
    if (!imgPrompt.trim()) return;
    setIsGeneratingImg(true);
    setShowImgPrompt(false);
    
    // Add placeholder message
    const placeholderId = Date.now().toString();
    const placeholderMsg: PlayerMessage = {
      id: placeholderId,
      senderId: campaign.isAiDm ? 'ai-dm' : 'dm',
      senderName: campaign.isAiDm ? 'Dungeon Master' : 'DM (You)',
      content: 'Manifesting a vision...',
      timestamp: Date.now()
    };
    
    const tempChat = [...campaign.playerChat, placeholderMsg];
    onUpdateCampaign({ ...campaign, playerChat: tempChat });

    try {
      const base64Image = await generateGameImage(imgPrompt);
      if (base64Image) {
        // Replace placeholder with actual image
        const finalMsg: PlayerMessage = {
          ...placeholderMsg,
          content: campaign.isAiDm ? "I have conjured this scene for you:" : `Shared visual: ${imgPrompt}`,
          attachmentUrl: base64Image
        };
        onUpdateCampaign({
          ...campaign,
          playerChat: campaign.playerChat.map(m => m.id === placeholderId ? finalMsg : m).concat([finalMsg]) // Fix concurrency issue by re-appending or mapping logic in real app
        });
        // Simplification: Re-read state in functional update or just append for this demo
        // Better way for this demo without deep state management changes:
        const freshChat = [...campaign.playerChat, finalMsg]; 
        onUpdateCampaign({ ...campaign, playerChat: freshChat });
      }
    } catch (e) {
      console.error(e);
      // Remove placeholder or show error
    } finally {
      setIsGeneratingImg(false);
      setImgPrompt('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-fantasy-900 relative">
      
      {/* Dice Tray */}
      <div className="bg-fantasy-900 border-b border-fantasy-700 p-3 shadow-md z-10">
        <div className="flex items-center justify-between mb-2">
           <span className="text-xs font-bold text-fantasy-muted uppercase tracking-wider flex items-center gap-2">
             {campaign.isAiDm ? <span className="text-fantasy-accent flex items-center gap-1"><Sparkles size={12}/> AI DM Active</span> : "DM Tools"}
           </span>
           <div className="flex gap-2">
              <button onClick={handleStartMeet} className="text-xs bg-red-600/20 border border-red-500/50 hover:bg-red-600 hover:text-white px-2 py-1 rounded text-red-400 transition-colors flex items-center gap-1">
                 <Video size={12} /> Start Meet
              </button>
              <button onClick={() => setShowImgPrompt(true)} disabled={isGeneratingImg} className="text-xs bg-fantasy-700 border border-fantasy-600 hover:border-fantasy-accent hover:text-white px-2 py-1 rounded text-fantasy-muted transition-colors flex items-center gap-1">
                <ImageIcon size={12} /> Visualize
              </button>
              <button onClick={() => handleRequestRoll("Initiative")} className="text-xs bg-fantasy-800 border border-fantasy-700 hover:border-fantasy-accent px-2 py-1 rounded text-fantasy-text transition-colors">Roll Init</button>
              <button onClick={() => handleRequestRoll("Perception")} className="text-xs bg-fantasy-800 border border-fantasy-700 hover:border-fantasy-accent px-2 py-1 rounded text-fantasy-text transition-colors">Roll Percep</button>
           </div>
        </div>
        <div className="flex gap-4 justify-center items-center">
          {[4, 6, 8, 10, 12, 20].map(d => (
            <DiceButton key={d} label={`D${d}`} sides={d} onClick={handleDMDiceRoll} />
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {campaign.playerChat.length === 0 && (
           <p className="text-center text-fantasy-muted text-sm mt-10">No messages yet.</p>
        )}
        {campaign.playerChat.map(msg => {
          // Alignment logic: 
          // If I am DM (isAiDm=false), 'dm' is Me (right). 'user' is left.
          // If I am Player (isAiDm=true), 'user' is Me (right). 'ai-dm' or 'dm' is Left.
          
          const isMe = campaign.isAiDm ? msg.senderId === 'user' : msg.senderId === 'dm';
          const isSystem = msg.senderId === 'ai-dm';

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className={`text-[10px] mb-1 px-1 ${isSystem ? 'text-fantasy-accent font-bold' : 'text-fantasy-muted'}`}>
                {msg.senderName}
              </span>
              <div className={`
                px-4 py-2 rounded-xl text-sm max-w-[85%] shadow-sm
                ${isMe ? 'bg-fantasy-700 text-white rounded-tr-none' : isSystem ? 'bg-fantasy-800 border border-fantasy-accent/30 text-fantasy-text' : 'bg-fantasy-800 border border-fantasy-700 text-fantasy-text rounded-tl-none'}
              `}>
                {msg.content}
                
                {msg.attachmentUrl && (
                  <div className="mt-3 mb-1 rounded-lg overflow-hidden border border-white/10">
                    <img src={msg.attachmentUrl} alt="Generated scene" className="w-full h-auto" />
                  </div>
                )}

                {msg.isRoll && msg.rollResult && (
                  <div className="mt-1 flex items-center gap-2 bg-black/20 rounded px-2 py-1">
                     <Dice5 size={14} className="text-fantasy-accent" />
                     <span className="font-bold text-white text-base">{msg.rollResult.total}</span>
                     <span className="text-xs text-fantasy-muted font-mono">({msg.rollResult.formula})</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {aiTyping && (
          <div className="flex items-center gap-2 text-fantasy-muted text-xs ml-2">
            <Loader2 size={12} className="animate-spin" />
            <span>The DM is thinking...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 bg-fantasy-800 border-t border-fantasy-700 flex gap-2">
         <input 
           className="flex-1 bg-fantasy-900 border border-fantasy-700 rounded px-3 py-2 text-white text-sm focus:border-fantasy-accent outline-none"
           placeholder={campaign.isAiDm ? "What do you do?" : "Message party..."}
           value={input}
           onChange={e => setInput(e.target.value)}
           onKeyDown={e => e.key === 'Enter' && handleSend()}
         />
         <button onClick={handleSend} disabled={!input} className="p-2 bg-fantasy-accent text-fantasy-900 rounded hover:bg-opacity-90 disabled:opacity-50">
           <Send size={16} />
         </button>
      </div>

      {/* Image Prompt Modal */}
      {showImgPrompt && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
           <div className="bg-fantasy-800 p-4 rounded-xl border border-fantasy-700 w-full max-w-sm shadow-2xl">
              <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                <Sparkles size={16} className="text-fantasy-accent"/> Generate Visual
              </h3>
              <textarea 
                className="w-full h-24 bg-fantasy-900 border border-fantasy-700 rounded p-2 text-white text-sm resize-none mb-3 outline-none focus:border-fantasy-accent"
                placeholder="Describe the scene, map, or monster..."
                value={imgPrompt}
                onChange={e => setImgPrompt(e.target.value)}
              />
              <div className="flex gap-2">
                 <button onClick={() => setShowImgPrompt(false)} className="flex-1 py-1.5 text-xs text-fantasy-muted hover:text-white">Cancel</button>
                 <button onClick={handleGenerateImage} disabled={!imgPrompt} className="flex-1 py-1.5 bg-fantasy-accent text-fantasy-900 rounded font-bold text-xs hover:bg-opacity-90">Generate</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};