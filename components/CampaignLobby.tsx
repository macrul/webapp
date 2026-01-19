import React, { useState } from 'react';
import { Campaign, CampaignTemplate } from '../types';
import { Plus, Play, Hash, Download, BookOpen, Crown, Image as ImageIcon } from 'lucide-react';
import { INITIAL_GREETING, PLAYER_GREETING } from '../constants';

interface CampaignLobbyProps {
  campaigns: Campaign[];
  onCreate: (campaign: Campaign) => void;
  onSelect: (campaignId: string) => void;
}

const TEMPLATES: CampaignTemplate[] = [
  {
    id: 't1',
    name: 'The Sunless Citadel',
    description: 'A crumbling fortress buried in the earth where goblins and kobolds vie for power.',
    introText: 'You stand before the ravine. The old road winds down into the darkness...',
    difficulty: 'Level 1-3',
    coverImage: 'https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 't2',
    name: 'Curse of the Crystal Bay',
    description: 'Pirates, haunted coves, and a mystery that threatens the trade routes.',
    introText: 'The salt air stings your eyes as the ship pulls into the fog-shrouded harbor.',
    difficulty: 'Level 3-5',
    coverImage: 'https://images.unsplash.com/photo-1478479405421-ce83c92fb3ba?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 't3',
    name: 'Shadows of the Spire',
    description: 'An urban intrigue adventure set in a city ruled by masked lords.',
    introText: 'Rain slicks the cobblestones of High Street. You have a message to deliver.',
    difficulty: 'Level 5-8',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=300&auto=format&fit=crop'
  }
];

export const CampaignLobby: React.FC<CampaignLobbyProps> = ({ campaigns, onCreate, onSelect }) => {
  const [view, setView] = useState<'lobby' | 'create' | 'import'>('lobby');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBanner, setNewBanner] = useState('');
  const [enableAiDm, setEnableAiDm] = useState(false);

  const handleCreate = () => {
    if (!newName.trim()) return;
    
    const greeting = enableAiDm ? PLAYER_GREETING : INITIAL_GREETING;

    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: newName,
      description: newDesc || 'A generic fantasy adventure.',
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      characters: [],
      logs: [],
      playerChat: [],
      aiChatHistory: [{ id: 'init', role: 'model', content: greeting, timestamp: Date.now() }],
      isAiDm: enableAiDm,
      bannerUrl: newBanner || undefined
    };

    onCreate(newCampaign);
    resetForm();
  };

  const handleImport = (template: CampaignTemplate) => {
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: template.name,
      description: template.description,
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      characters: [],
      logs: [{ id: 'init-log', timestamp: Date.now(), type: 'note', content: `Campaign started: ${template.name}` }],
      playerChat: [
        {
          id: 'intro',
          senderId: 'ai-dm',
          senderName: 'Dungeon Master',
          content: template.introText,
          timestamp: Date.now(),
        }
      ],
      aiChatHistory: [{ id: 'init', role: 'model', content: PLAYER_GREETING, timestamp: Date.now() }],
      isAiDm: true, // Imports default to AI DM mode so the user can play
      bannerUrl: template.coverImage
    };
    onCreate(newCampaign);
    resetForm();
  };

  const resetForm = () => {
    setView('lobby');
    setNewName('');
    setNewDesc('');
    setNewBanner('');
    setEnableAiDm(false);
  };

  if (view === 'create') {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-fantasy-800 rounded-2xl p-6 max-w-md w-full border border-fantasy-700 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-4">Create New World</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-fantasy-muted uppercase mb-1">Campaign Name</label>
              <input 
                autoFocus
                className="w-full bg-fantasy-900 border border-fantasy-700 rounded-lg p-2 text-white focus:border-fantasy-accent outline-none"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="The Lost Mines..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-fantasy-muted uppercase mb-1">Description</label>
              <textarea 
                className="w-full bg-fantasy-900 border border-fantasy-700 rounded-lg p-2 text-white focus:border-fantasy-accent outline-none h-24 resize-none"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="A dark fantasy adventure in..."
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-fantasy-muted uppercase mb-1">Banner Image URL</label>
              <div className="relative">
                 <ImageIcon size={14} className="absolute left-2.5 top-2.5 text-fantasy-muted" />
                 <input 
                   className="w-full bg-fantasy-900 border border-fantasy-700 rounded-lg p-2 pl-8 text-white focus:border-fantasy-accent outline-none text-sm"
                   value={newBanner}
                   onChange={e => setNewBanner(e.target.value)}
                   placeholder="https://..."
                 />
              </div>
            </div>

            <div className="flex items-center gap-2 bg-fantasy-900/50 p-3 rounded-lg border border-fantasy-700">
               <input 
                 type="checkbox" 
                 id="aiDmToggle" 
                 checked={enableAiDm} 
                 onChange={e => setEnableAiDm(e.target.checked)}
                 className="w-4 h-4 rounded border-fantasy-600 bg-fantasy-800 text-fantasy-accent focus:ring-fantasy-accent"
               />
               <div>
                 <label htmlFor="aiDmToggle" className="block text-sm font-bold text-white cursor-pointer">Enable AI Dungeon Master</label>
                 <p className="text-xs text-fantasy-muted">You play as a character, AI runs the story.</p>
               </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={resetForm} className="flex-1 py-2 rounded-lg border border-fantasy-600 text-fantasy-muted hover:bg-fantasy-700 transition-colors">Cancel</button>
            <button onClick={handleCreate} disabled={!newName} className="flex-1 py-2 rounded-lg bg-fantasy-accent text-fantasy-900 font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50">Create</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8 bg-fantasy-900">
      <div className="max-w-5xl w-full">
        <h1 className="text-3xl font-serif font-bold text-white mb-2 text-center">Campaign Select</h1>
        <p className="text-fantasy-muted text-center mb-8">Choose a world to enter or create a new one.</p>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          <button 
            onClick={() => setView('lobby')} 
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${view === 'lobby' ? 'bg-fantasy-700 text-white' : 'text-fantasy-muted hover:text-white'}`}
          >
            My Campaigns
          </button>
          <button 
            onClick={() => setView('import')} 
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${view === 'import' ? 'bg-fantasy-700 text-white' : 'text-fantasy-muted hover:text-white'}`}
          >
            Import Module
          </button>
        </div>

        {view === 'lobby' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Existing Campaigns - Rendered First */}
            {campaigns.map(c => (
              <div 
                key={c.id} 
                onClick={() => onSelect(c.id)}
                className="bg-fantasy-800 border border-fantasy-700 rounded-xl flex flex-col hover:shadow-xl hover:border-fantasy-accent transition-all relative group overflow-hidden cursor-pointer h-[240px] transform hover:-translate-y-1"
              >
                {c.bannerUrl && (
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${c.bannerUrl})` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-fantasy-900 via-fantasy-900/80 to-transparent"></div>
                  </div>
                )}
                {!c.bannerUrl && (
                  <div className="absolute inset-0 bg-gradient-to-br from-fantasy-800 to-fantasy-900"></div>
                )}
                
                <div className="p-6 flex-1 flex flex-col relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white leading-tight pr-4 drop-shadow-md">{c.name}</h3>
                    {c.isAiDm && (
                      <div className="flex-shrink-0 bg-fantasy-accent text-fantasy-900 p-1 rounded shadow-lg" title="AI Dungeon Master">
                          <Crown size={14} fill="currentColor" />
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-fantasy-muted mb-4 line-clamp-3 flex-1">{c.description}</p>
                  
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 text-xs text-fantasy-300">
                       <Hash size={12} className="text-fantasy-muted"/>
                       <span className="font-mono bg-black/30 px-1.5 py-0.5 rounded">{c.inviteCode}</span>
                    </div>
                    <button 
                      className="bg-fantasy-700 group-hover:bg-fantasy-accent group-hover:text-fantasy-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg"
                    >
                      <Play size={14} fill="currentColor" /> Enter
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Create New Card - Rendered Last */}
            <div 
              className="bg-fantasy-800/50 border border-fantasy-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-fantasy-800 hover:border-fantasy-500 transition-all group min-h-[240px]" 
              onClick={() => setView('create')}
            >
               <div className="w-16 h-16 bg-fantasy-700 rounded-full flex items-center justify-center mb-4 group-hover:bg-fantasy-600 transition-colors shadow-inner">
                 <Plus className="text-fantasy-muted group-hover:text-white" size={32} />
               </div>
               <span className="font-bold text-fantasy-muted group-hover:text-white transition-colors">Create New World</span>
            </div>
          </div>
        )}

        {view === 'import' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {TEMPLATES.map(template => (
               <div key={template.id} className="bg-fantasy-800 border border-fantasy-700 rounded-xl overflow-hidden hover:shadow-xl transition-all flex flex-col h-[300px]">
                  <div className="h-32 bg-gray-800 relative shrink-0">
                     <img src={template.coverImage} className="w-full h-full object-cover opacity-80" alt={template.name} />
                     <div className="absolute inset-0 bg-gradient-to-t from-fantasy-800 to-transparent" />
                     <span className="absolute bottom-2 left-4 text-xs font-bold bg-black/60 px-2 py-1 rounded text-white border border-white/20 backdrop-blur-sm">{template.difficulty}</span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-2">{template.name}</h3>
                    <p className="text-sm text-fantasy-muted mb-4 line-clamp-3">{template.description}</p>
                    <button 
                      onClick={() => handleImport(template)}
                      className="mt-auto w-full py-2 bg-fantasy-700 hover:bg-fantasy-success hover:text-fantasy-900 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Download size={16} /> Import & Play
                    </button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};