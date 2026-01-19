import React, { useState, useRef, useEffect } from 'react';
import { Campaign, LogEntry } from '../types';
import { PenTool, CheckCircle, Flag, MessageCircle, Clock } from 'lucide-react';

interface SessionLoggerProps {
  campaign: Campaign;
  onUpdateCampaign: (updatedCampaign: Campaign) => void;
}

export const SessionLogger: React.FC<SessionLoggerProps> = ({ campaign, onUpdateCampaign }) => {
  const [note, setNote] = useState('');
  const [type, setType] = useState<LogEntry['type']>('note');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [campaign.logs]);

  const addLog = () => {
    if (!note.trim()) return;
    
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      content: note,
      type: type
    };

    onUpdateCampaign({
      ...campaign,
      logs: [...campaign.logs, newLog]
    });
    setNote('');
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getIcon = (t: LogEntry['type']) => {
    switch(t) {
      case 'decision': return <CheckCircle size={16} className="text-fantasy-success" />;
      case 'quest': return <Flag size={16} className="text-fantasy-warning" />;
      case 'interaction': return <MessageCircle size={16} className="text-blue-400" />;
      default: return <PenTool size={16} className="text-fantasy-muted" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-fantasy-900">
       {/* Timeline View */}
       <div className="flex-1 overflow-y-auto p-6" ref={scrollRef}>
          <h2 className="text-2xl font-serif font-bold text-white mb-6 sticky top-0 bg-fantasy-900 z-10 py-2">Session Logs</h2>
          <div className="relative border-l-2 border-fantasy-700 ml-4 space-y-8">
            {campaign.logs.length === 0 && (
              <p className="pl-8 text-fantasy-muted italic">No entries yet. Start the adventure!</p>
            )}
            
            {campaign.logs.map((log) => (
              <div key={log.id} className="relative pl-8">
                {/* Timeline Dot */}
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-fantasy-800 border-2 border-fantasy-600 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-fantasy-accent"></div>
                </div>
                
                <div className="bg-fantasy-800 border border-fantasy-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                     <div className="flex items-center gap-2">
                       {getIcon(log.type)}
                       <span className="text-xs font-bold uppercase text-fantasy-muted tracking-wider">{log.type}</span>
                     </div>
                     <span className="text-xs text-fantasy-muted flex items-center gap-1"><Clock size={10} /> {formatTime(log.timestamp)}</span>
                  </div>
                  <p className="text-fantasy-text text-sm">{log.content}</p>
                </div>
              </div>
            ))}
          </div>
       </div>

       {/* Input Area */}
       <div className="p-4 bg-fantasy-800 border-t border-fantasy-700">
         <div className="flex gap-2 mb-2">
            {(['note', 'decision', 'quest', 'interaction'] as const).map((t) => (
              <button 
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${type === t ? 'bg-fantasy-700 border-fantasy-accent text-white' : 'border-fantasy-600 text-fantasy-muted hover:border-fantasy-500'}`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
         </div>
         <div className="flex gap-2">
           <input 
             className="flex-1 bg-fantasy-900 border border-fantasy-700 rounded-lg px-3 py-2 text-white focus:border-fantasy-accent outline-none"
             placeholder="Log a key moment..."
             value={note}
             onChange={e => setNote(e.target.value)}
             onKeyDown={e => e.key === 'Enter' && addLog()}
           />
           <button onClick={addLog} disabled={!note.trim()} className="bg-fantasy-accent text-fantasy-900 px-4 rounded-lg font-bold hover:bg-opacity-90 disabled:opacity-50">Log</button>
         </div>
       </div>
    </div>
  );
};
