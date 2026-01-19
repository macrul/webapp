import React, { useState } from 'react';
import { Campaign, Character, User as UserType } from '../types';
import { User, Shield, Zap, RefreshCw, Save, Trash2, Image as ImageIcon, Mail, Link as LinkIcon, Check, Copy, X, UserPlus, Maximize2, RotateCcw } from 'lucide-react';
import { CharacterSheet } from './CharacterSheet';

interface CharacterManagerProps {
  campaign: Campaign;
  users: UserType[]; // Pass global users list
  onUpdateCampaign: (updatedCampaign: Campaign) => void;
}

const INITIAL_STATS = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

export const CharacterManager: React.FC<CharacterManagerProps> = ({ campaign, users, onUpdateCampaign }) => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [newChar, setNewChar] = useState<Partial<Character>>({ stats: INITIAL_STATS, level: 1 });
  
  // Modal States
  const [assigningChar, setAssigningChar] = useState<Character | null>(null);
  const [expandedChar, setExpandedChar] = useState<Character | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSave = () => {
    if (!newChar.name || !newChar.race || !newChar.class) return;
    
    const character: Character = {
      id: Date.now().toString(),
      name: newChar.name,
      race: newChar.race,
      class: newChar.class,
      background: newChar.background || 'Unknown',
      level: newChar.level || 1,
      stats: newChar.stats || INITIAL_STATS,
      bio: newChar.bio || '',
      imageUrl: newChar.imageUrl || `https://api.dicebear.com/9.x/adventurer/svg?seed=${newChar.name}`,
      playerId: newChar.playerId,
      inviteStatus: newChar.playerId ? 'accepted' : 'none',
      // Defaults for sheet
      hp: { current: 10, max: 10, temp: 0 },
      armorClass: 10,
      speed: 30,
      skills: [],
      proficiencies: "Common",
      attacks: [{ name: "Unarmed Strike", bonus: "+2", damage: "1d4", type: "Bludgeoning" }]
    };

    onUpdateCampaign({
      ...campaign,
      characters: [...campaign.characters, character]
    });

    setView('list');
    setNewChar({ stats: INITIAL_STATS, level: 1 });
  };

  const handleStatChange = (stat: keyof typeof INITIAL_STATS, delta: number) => {
    if (!newChar.stats) return;
    const current = newChar.stats[stat];
    setNewChar({
      ...newChar,
      stats: { ...newChar.stats, [stat]: Math.max(1, Math.min(20, current + delta)) }
    });
  };

  const preGenerate = () => {
    const templates = [
      { 
        name: "Thorgar", 
        race: "Dwarf", 
        class: "Fighter", 
        background: "Soldier", 
        stats: { str: 16, dex: 12, con: 15, int: 8, wis: 13, cha: 10 },
        bio: "A grumpy dwarf with a heart of gold (and a lust for actual gold).",
        imageUrl: "https://api.dicebear.com/9.x/adventurer/svg?seed=Thorgar",
      },
      { 
        name: "Elara", 
        race: "Elf", 
        class: "Wizard", 
        background: "Sage", 
        stats: { str: 8, dex: 14, con: 12, int: 17, wis: 13, cha: 10 },
        bio: "She seeks the lost library of the Ancients.",
        imageUrl: "https://api.dicebear.com/9.x/adventurer/svg?seed=Elara",
      },
    ];
    const random = templates[Math.floor(Math.random() * templates.length)];
    setNewChar({ ...random, level: 1 });
  };

  const deleteCharacter = (id: string) => {
    if(!window.confirm("Remove this character?")) return;
    onUpdateCampaign({
      ...campaign,
      characters: campaign.characters.filter(c => c.id !== id)
    });
  };

  const openAssignModal = (e: React.MouseEvent, char: Character) => {
    e.stopPropagation();
    setAssigningChar(char);
    setSearchTerm('');
  };

  const assignUser = (userId: string) => {
    if (!assigningChar) return;
    const updated = campaign.characters.map(c => {
      if (c.id === assigningChar.id) {
        return { ...c, playerId: userId, inviteStatus: 'accepted' as const };
      }
      return c;
    });
    onUpdateCampaign({ ...campaign, characters: updated });
    setAssigningChar(null);
  };

  const getUserById = (id: string) => users.find(u => u.id === id);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (view === 'list') {
    return (
      <div className="p-6 h-full overflow-y-auto bg-fantasy-900 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-serif font-bold text-white">Party Roster</h2>
          <button onClick={() => setView('create')} className="bg-fantasy-accent text-fantasy-900 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-opacity-90">
            <User size={18} /> New Character
          </button>
        </div>
        
        {campaign.characters.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-fantasy-700 rounded-xl">
             <p className="text-fantasy-muted">No adventurers have gathered yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaign.characters.map(char => {
              const assignedUser = char.playerId ? getUserById(char.playerId) : null;
              
              return (
                <div 
                  key={char.id} 
                  className="bg-fantasy-800 border border-fantasy-700 rounded-xl overflow-hidden shadow-lg relative group flex flex-col cursor-pointer hover:border-fantasy-accent transition-colors"
                  onClick={() => setExpandedChar(char)}
                >
                  <div className="h-32 bg-fantasy-700 relative">
                     {char.imageUrl ? (
                       <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-fantasy-500">
                         <User size={48} />
                       </div>
                     )}
                     <div className="absolute top-2 right-2 flex gap-1 z-10">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setExpandedChar(char); }}
                          className="p-1.5 bg-black/50 rounded-full text-white hover:bg-fantasy-accent hover:text-fantasy-900 transition-colors"
                          title="Maximize / View Sheet"
                        >
                          <Maximize2 size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteCharacter(char.id); }}
                          className="p-1.5 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors"
                          title="Delete Character"
                        >
                          <Trash2 size={14} />
                        </button>
                     </div>
                    <div className="absolute bottom-[-16px] left-4 w-10 h-10 bg-fantasy-800 border-2 border-fantasy-700 rounded-full flex items-center justify-center text-fantasy-accent font-bold z-10">
                       {char.level}
                     </div>
                  </div>
                  
                  <div className="p-4 pt-6 flex-1 flex flex-col">
                     <div className="mb-3">
                       <h3 className="font-bold text-white text-lg leading-tight">{char.name}</h3>
                       <p className="text-xs text-fantasy-accent font-semibold uppercase tracking-wider">{char.race} {char.class}</p>
                     </div>
                     
                     {/* Assignment Section */}
                     <div className="mb-4">
                       {assignedUser ? (
                         <div 
                           onClick={(e) => openAssignModal(e, char)}
                           className="flex items-center justify-between text-xs bg-fantasy-900/50 p-2 rounded border border-fantasy-success/30 text-fantasy-success cursor-pointer hover:border-fantasy-success hover:bg-fantasy-800 transition-all group/assign"
                           title="Click to Reassign Player"
                         >
                            <div className="flex items-center gap-2">
                              <img src={assignedUser.avatarUrl} className="w-5 h-5 rounded-full" />
                              <div className="flex flex-col">
                                <span className="font-bold">{assignedUser.name}</span>
                                <span className="text-[10px] opacity-70">Assigned</span>
                              </div>
                            </div>
                            <RotateCcw size={12} className="opacity-0 group-hover/assign:opacity-100 transition-opacity text-fantasy-muted" />
                         </div>
                       ) : (
                         <button 
                           onClick={(e) => openAssignModal(e, char)}
                           className="w-full flex items-center justify-center gap-2 text-xs bg-fantasy-700 hover:bg-fantasy-600 p-2 rounded text-white transition-colors"
                         >
                            <UserPlus size={12} />
                            <span>Assign Player</span>
                         </button>
                       )}
                     </div>

                     <div className="mt-auto">
                       <div className="grid grid-cols-3 gap-2 text-center text-xs">
                         {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map(stat => (
                           <div key={stat} className="bg-fantasy-900/50 p-1.5 rounded border border-white/5">
                             <span className="block text-fantasy-muted font-mono text-[10px]">{stat.toUpperCase()}</span>
                             <span className="font-bold text-white text-sm">{char.stats[stat]}</span>
                           </div>
                         ))}
                       </div>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Character Sheet Modal (Maximized View) */}
        {expandedChar && (
          <CharacterSheet 
            character={expandedChar} 
            player={expandedChar.playerId ? getUserById(expandedChar.playerId) : undefined}
            onClose={() => setExpandedChar(null)} 
          />
        )}

        {/* Assignment Modal */}
        {assigningChar && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-fantasy-800 p-6 rounded-xl border border-fantasy-700 w-full max-w-md shadow-2xl relative flex flex-col max-h-[80vh]">
              <button onClick={() => setAssigningChar(null)} className="absolute top-4 right-4 text-fantasy-muted hover:text-white">
                <X size={20} />
              </button>
              
              <h3 className="text-xl font-serif font-bold text-white mb-1">Assign Character</h3>
              <p className="text-sm text-fantasy-muted mb-4">Select a registered user to play <span className="text-fantasy-accent">{assigningChar.name}</span>.</p>
              
              <input 
                 className="w-full bg-fantasy-900 border border-fantasy-700 rounded px-3 py-2 text-white focus:border-fantasy-accent outline-none mb-4"
                 placeholder="Search users..."
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 autoFocus
              />

              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                 {filteredUsers.map(user => (
                   <div 
                     key={user.id} 
                     onClick={() => assignUser(user.id)}
                     className="flex items-center gap-3 p-3 rounded bg-fantasy-900/50 hover:bg-fantasy-700 cursor-pointer border border-transparent hover:border-fantasy-accent transition-all"
                   >
                      <img src={user.avatarUrl} className="w-8 h-8 rounded-full" />
                      <div>
                        <div className="font-bold text-white text-sm">{user.name}</div>
                        <div className="text-xs text-fantasy-muted">{user.email}</div>
                      </div>
                   </div>
                 ))}
                 {filteredUsers.length === 0 && (
                   <p className="text-center text-fantasy-muted text-sm py-4">No users found.</p>
                 )}
              </div>

              <div className="text-center">
                 <button onClick={() => setAssigningChar(null)} className="text-sm text-fantasy-muted hover:text-white">Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto bg-fantasy-900">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-serif font-bold text-white mb-6">Create Character</h2>
        <div className="bg-fantasy-800 border border-fantasy-700 rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Basic Inputs */}
             <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-fantasy-muted uppercase mb-1">Name</label>
                    <input className="w-full bg-fantasy-900 border border-fantasy-700 rounded px-3 py-2 text-white focus:border-fantasy-accent outline-none" value={newChar.name || ''} onChange={e => setNewChar({...newChar, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-fantasy-muted uppercase mb-1">Level</label>
                    <input type="number" className="w-full bg-fantasy-900 border border-fantasy-700 rounded px-3 py-2 text-white focus:border-fantasy-accent outline-none" value={newChar.level || 1} onChange={e => setNewChar({...newChar, level: parseInt(e.target.value)})} />
                  </div>
               </div>
               {/* Race/Class Selects */}
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-fantasy-muted uppercase mb-1">Race</label>
                     <select className="w-full bg-fantasy-900 border border-fantasy-700 rounded px-3 py-2 text-white outline-none" value={newChar.race || ''} onChange={e => setNewChar({...newChar, race: e.target.value})}>
                       <option value="">Select...</option>
                       <option value="Human">Human</option>
                       <option value="Elf">Elf</option>
                       <option value="Dwarf">Dwarf</option>
                       <option value="Tiefling">Tiefling</option>
                       <option value="Dragonborn">Dragonborn</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-fantasy-muted uppercase mb-1">Class</label>
                     <select className="w-full bg-fantasy-900 border border-fantasy-700 rounded px-3 py-2 text-white outline-none" value={newChar.class || ''} onChange={e => setNewChar({...newChar, class: e.target.value})}>
                        <option value="">Select...</option>
                        <option value="Fighter">Fighter</option>
                        <option value="Wizard">Wizard</option>
                        <option value="Rogue">Rogue</option>
                        <option value="Cleric">Cleric</option>
                        <option value="Bard">Bard</option>
                        <option value="Paladin">Paladin</option>
                     </select>
                  </div>
               </div>
               
               {/* Quick User Select */}
               <div>
                  <label className="block text-xs font-bold text-fantasy-muted uppercase mb-1">Assign Player</label>
                  <select 
                    className="w-full bg-fantasy-900 border border-fantasy-700 rounded px-3 py-2 text-white text-sm outline-none"
                    value={newChar.playerId || ''}
                    onChange={e => setNewChar({...newChar, playerId: e.target.value})}
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
               </div>
             </div>
             
             {/* Bio/Image */}
             <div className="space-y-4">
                <div>
                   <label className="block text-xs font-bold text-fantasy-muted uppercase mb-1">Portrait URL</label>
                   <input className="w-full bg-fantasy-900 border border-fantasy-700 rounded px-3 py-2 text-white text-sm outline-none" value={newChar.imageUrl || ''} onChange={e => setNewChar({...newChar, imageUrl: e.target.value})} />
                </div>
                <div>
                   <label className="block text-xs font-bold text-fantasy-muted uppercase mb-1">Bio</label>
                   <textarea className="w-full bg-fantasy-900 border border-fantasy-700 rounded px-3 py-2 text-white text-sm h-24 resize-none outline-none" value={newChar.bio || ''} onChange={e => setNewChar({...newChar, bio: e.target.value})} />
                </div>
             </div>
          </div>

          <div className="flex gap-3">
             <button onClick={() => setView('list')} className="flex-1 py-3 border border-fantasy-700 rounded-lg text-fantasy-muted hover:text-white">Cancel</button>
             <button onClick={handleSave} disabled={!newChar.name || !newChar.class} className="flex-1 py-3 bg-fantasy-accent text-fantasy-900 font-bold rounded-lg hover:bg-opacity-90 disabled:opacity-50">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};