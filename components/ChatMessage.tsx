import React, { useMemo } from 'react';
import { Message, CardType, ExtractedCard } from '../types';
import { Bot, User as UserIcon, AlertOctagon } from 'lucide-react';
import { CardDisplay } from './CardDisplay';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  // Helper to extract cards from the message text
  const contentParts = useMemo(() => {
    if (isUser) return [{ type: 'text', content: message.content }];

    // Regex to match card blocks
    // Matches patterns like "NPC CARD\n...content..."
    // We look for the headers defined in the system prompt
    const cardHeaders = [
      'NPC CARD',
      'LOCATION CARD',
      'QUEST CARD',
      'ENCOUNTER CARD',
      'ITEM CARD'
    ];
    
    // We split the message by these headers to separate text from cards
    // This is a naive parser but works for the structured output requested
    const fullText = message.content;
    const parts: Array<{ type: 'text' | 'card'; content: string | ExtractedCard }> = [];
    
    let currentIndex = 0;
    
    // Find all occurrences of headers
    const matches: Array<{ index: number, type: CardType }> = [];
    cardHeaders.forEach(header => {
      let searchIndex = 0;
      while (true) {
        const idx = fullText.indexOf(header, searchIndex);
        if (idx === -1) break;
        matches.push({ index: idx, type: header as CardType });
        searchIndex = idx + header.length;
      }
    });

    matches.sort((a, b) => a.index - b.index);

    matches.forEach((match, i) => {
      // Text before this card
      if (match.index > currentIndex) {
        parts.push({ 
          type: 'text', 
          content: fullText.substring(currentIndex, match.index) 
        });
      }

      // Determine end of this card (either next card start or end of string)
      const nextMatch = matches[i + 1];
      const endOfCard = nextMatch ? nextMatch.index : fullText.length;
      const cardContent = fullText.substring(match.index, endOfCard);
      
      parts.push({
        type: 'card',
        content: { type: match.type, content: cardContent }
      });

      currentIndex = endOfCard;
    });

    // Remaining text
    if (currentIndex < fullText.length) {
      parts.push({ type: 'text', content: fullText.substring(currentIndex) });
    }

    // If no cards found, return full text
    if (parts.length === 0) return [{ type: 'text', content: fullText }];

    return parts;
  }, [message.content, isUser]);

  // Check for Safety/Issue block
  const isSafetyAlert = message.content.includes("ISSUE NOTICED:");
  const isPanicResponse = message.content.includes("OPTION A – Soft Fix");

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-fantasy-accent text-fantasy-900' : isSafetyAlert ? 'bg-red-500 text-white' : 'bg-fantasy-700 text-fantasy-text'}`}>
          {isUser ? <UserIcon size={18} /> : isSafetyAlert ? <AlertOctagon size={18} /> : <Bot size={18} />}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`
            px-4 py-3 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed
            ${isUser 
              ? 'bg-fantasy-accent text-fantasy-900 rounded-tr-sm font-medium' 
              : isSafetyAlert 
                ? 'bg-red-900/40 border border-red-500/50 text-red-100 rounded-tl-sm' 
                : isPanicResponse 
                  ? 'bg-fantasy-800 border border-fantasy-warning/30 rounded-tl-sm' 
                  : 'bg-fantasy-800 text-fantasy-text rounded-tl-sm border border-fantasy-700'}
          `}>
            {contentParts.map((part, idx) => {
              if (part.type === 'card') {
                return <CardDisplay key={idx} card={part.content as ExtractedCard} />;
              }
              return (
                <div key={idx} className="markdown-body">
                  <ReactMarkdown 
                    components={{
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1" {...props} />,
                      strong: ({node, ...props}) => <strong className="text-fantasy-accent font-semibold" {...props} />
                    }}
                  >
                    {part.content as string}
                  </ReactMarkdown>
                </div>
              );
            })}
          </div>
          <span className="text-xs text-fantasy-muted mt-1 px-1">
            {isUser ? 'DM' : 'Co-Pilot'}
          </span>
        </div>
      </div>
    </div>
  );
};
