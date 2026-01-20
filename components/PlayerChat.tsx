import React, { useState, useRef, useEffect } from 'react';
import { Campaign, PlayerMessage } from '../types';
import { Send, Dice5, Image as ImageIcon, Sparkles, Loader2, Video } from 'lucide-react';
import { generateGameImage, getAiDmResponse } from '../services/geminiService';

interface PlayerChatProps {
  campaign: Campaign;
  onUpdateCampaign: (updatedCampaign: Campaign) => void;
}

const getDiceStyles = (sides: number) => {
  switch(sides) {
    case 4: return { text: 'text-emerald-300', fill: 'fill-emerald-900/40', stroke: 'stroke-emerald-500' };
    case 6: return { text: 'text-blue-300', fill: 'fill-blue-900/40', stroke: 'stroke-blue-500' };
    case 8: return { text: 'text-violet-300', fill: 'fill-violet-900/40', stroke: 'stroke-violet-500' };
    case 10: return { text: 'text-fuchsia-300', fill: 'fill-fuchsia-900/40', stroke: 'stroke-fuchsia-500' };
    case 12: return { text: 'text-orange-300', fill: 'fill-orange-900/40', stroke: 'stroke-orange-500' };
    case 20: return { text: 'text-red-300', fill: 'fill-red-900/40', stroke: 'stroke-red-500' };
    default: return { text: 'text-gray-300', fill: 'fill-gray-900/40', stroke: 'stroke-gray-500' };
  }
};

const DiceIcon = ({ sides, isRolling }: { sides: number, isRolling?: boolean }) => {
  const styles = getDiceStyles(sides);
  const commonClasses = `${styles.fill} ${styles.stroke} stroke-2 transition-all duration-300`;
  const textClass = `${styles.text} font-bold select-none pointer-events-none`;
  const containerClass = `w-10 h-10 transition-transform duration-500 ${isRolling ? 'animate-spin' : 'group-hover:scale-110'}`;

  const content = (() => {
    switch(sides) {
      case 4:
        return (
          <>
             <path d="M12 2L22 22H2L12 2Z" className={commonClasses} />
             <text x="12" y="17" textAnchor="middle" fontSize="6" fill="currentColor" className={textClass}>D4</text>
          </>
        );
      case 6:
        return (
          <>
             <rect x="4" y="4" width="16" height="16" rx="3" className={commonClasses} />
             <text x="12" y="14.5" textAnchor="middle" fontSize="6" fill="currentColor" className={textClass}>D6</text>
          </>
        );
      case 8:
        return (
          <>
             <path d="M12 2L22 12L12 22L2 12L12 2Z" className={commonClasses} />
             <text x="12" y="14.5" textAnchor="middle" fontSize="6" fill="currentColor" className={textClass}>D8</text>
          </>
        );
      case 10:
        return (
          <>
             <path d="M12 1.5L22 10L12 22.5L2 10L12 1.5Z" className={commonClasses} />
             <path d="M2 10L22 10" className={`stroke-1 opacity-30 ${styles.stroke}`} />
             <text x="12" y="15" textAnchor="middle" fontSize="6" fill="currentColor" className={textClass}>D10</text>
          </>
        );
      case 12:
        return (
          <>
             <path d="M12 2L21.5 9L17.9 20.1H6.1L2.5 9L12 2Z" className={commonClasses} />
             <text x="12" y="14.5" textAnchor="middle" fontSize="6" fill="currentColor" className={textClass}>D12</text>
          </>
        );
      case 20:
        return (
          <>
             <path d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z" className={commonClasses} />
             <text x="12" y="14.5" textAnchor="middle" fontSize="6" fill="currentColor" className={textClass}>D20</text>
          </>
        );
      default:
        return <Dice5 size={24} className={styles.text} />;
    }
  })();

  return (
    <svg viewBox="0 0 24 24" className={containerClass}>
      {content}
    </svg>
  );
};

interface DiceButtonProps {
  sides: number;
  isRolling: boolean;
  onClick: (s: number) => void;
}

const DiceButton: React.FC<DiceButtonProps> = ({ sides, isRolling, onClick }) => (
  <button 
    onClick={() => onClick(sides)}
    className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-fantasy-800/50 transition-all group active:scale-95 relative"
    title={`Roll D${sides}`}
    disabled={isRolling}
  >
    <div className="relative">
      <DiceIcon sides={sides} isRolling={isRolling} />
      {isRolling && (
         <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles size={16} className="text-white animate-pulse" />
         </div>
      )}
    </div>
  </button>
);

export const PlayerChat: React.FC<PlayerChatProps> = ({ campaign, onUpdateCampaign }) => {
  const [input, setInput] = useState('');
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [showImgPrompt, setShowImgPrompt] = useState(false);
  const [imgPrompt, setImgPrompt] = useState('');
  const [aiTyping, setAiTyping] = useState(false);
  const [rollingSide, setRollingSide] = useState<number | null>(null);

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
    if (rollingSide !== null) return; // Prevent spamming while rolling
    setRollingSide(sides);

    // Simulate roll duration
    setTimeout(() => {
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
        setRollingSide(null);

        // If AI DM is on, AI might react to the roll
        if (campaign.isAiDm) {
          triggerAiDm([...campaign.playerChat, msg]);
        }
    }, 600);
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
      <div className="bg-fantasy-900 border-b border-fantasy-700 p-4 shadow-xl z-10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
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
        
        {/* Dice Buttons Row */}
        <div className="flex gap-4 justify-center items-center py-1">
          {[4, 6, 8, 10, 12, 20].map(d => (
            <DiceButton 
              key={d} 
              sides={d} 
              isRolling={rollingSide === d}
              onClick={handleDMDiceRoll} 
            />
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {campaign.playerChat.length === 0 && (
           <p className="text-center text-fantasy-muted text-sm mt-10">No messages yet.</p>
        )}
        {campaign.playerChat.map(msg => {
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
                  <div className="mt-2 flex items-center gap-3 bg-black/20 rounded-lg p-2 border border-white/5">
                     <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-fantasy-900 shadow-inner ${getDiceStyles(parseInt(msg.rollResult.formula.replace('1d', '')) || 20).text}`}>
                       <Dice5 size={18} className="animate-pulse" />
                     </div>
                     <div className="flex flex-col">
                        <span className="font-bold text-white text-lg leading-none">{msg.rollResult.total}</span>
                        <span className="text-[10px] text-fantasy-muted font-mono">{msg.rollResult.formula}</span>
                     </div>
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