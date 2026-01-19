import React from 'react';
import { CardType, ExtractedCard } from '../types';
import { Map, User, Scroll, ShieldAlert, Sparkles, AlertTriangle } from 'lucide-react';

interface CardDisplayProps {
  card: ExtractedCard;
}

const getCardIcon = (type: CardType) => {
  switch (type) {
    case CardType.NPC: return <User className="w-5 h-5 text-fantasy-accent" />;
    case CardType.LOCATION: return <Map className="w-5 h-5 text-fantasy-success" />;
    case CardType.QUEST: return <Scroll className="w-5 h-5 text-fantasy-warning" />;
    case CardType.ENCOUNTER: return <ShieldAlert className="w-5 h-5 text-fantasy-danger" />;
    case CardType.ITEM: return <Sparkles className="w-5 h-5 text-purple-400" />;
    default: return <Sparkles className="w-5 h-5" />;
  }
};

const getCardColor = (type: CardType) => {
  switch (type) {
    case CardType.NPC: return 'border-fantasy-accent bg-fantasy-800/50';
    case CardType.LOCATION: return 'border-fantasy-success bg-fantasy-800/50';
    case CardType.QUEST: return 'border-fantasy-warning bg-fantasy-800/50';
    case CardType.ENCOUNTER: return 'border-fantasy-danger bg-fantasy-800/50';
    case CardType.ITEM: return 'border-purple-500 bg-fantasy-800/50';
    default: return 'border-fantasy-700 bg-fantasy-800';
  }
};

const parseCardContent = (content: string) => {
  // Split by newlines and render key-value pairs if possible
  const lines = content.split('\n').filter(line => line.trim() !== '');
  return lines.map((line, idx) => {
    const splitIndex = line.indexOf(':');
    if (splitIndex > -1) {
      const key = line.substring(0, splitIndex).trim();
      const value = line.substring(splitIndex + 1).trim();
      return (
        <div key={idx} className="mb-2 last:mb-0">
          <span className="font-bold text-fantasy-text/90 uppercase text-xs tracking-wider block">{key}</span>
          <span className="text-fantasy-text/80 text-sm leading-relaxed">{value}</span>
        </div>
      );
    }
    return <p key={idx} className="text-sm mb-2">{line}</p>;
  });
};

export const CardDisplay: React.FC<CardDisplayProps> = ({ card }) => {
  // Remove the header line (e.g., "NPC CARD") from content for cleaner display
  const cleanContent = card.content.replace(new RegExp(`^${card.type}\\s*\\n?`, 'i'), '').trim();

  return (
    <div className={`mt-4 mb-2 border-l-4 rounded-r-lg p-4 shadow-md ${getCardColor(card.type)}`}>
      <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
        {getCardIcon(card.type)}
        <h3 className="font-serif font-bold text-base text-white tracking-wide">{card.type}</h3>
      </div>
      <div className="space-y-1">
        {parseCardContent(cleanContent)}
      </div>
    </div>
  );
};
