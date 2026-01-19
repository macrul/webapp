import React, { useState } from 'react';
import { Character, User } from '../types';
import { X, Shield, Heart, Zap, Wind, Minimize2, Sword, Backpack, Scroll, Brain, Eye, User as UserIcon } from 'lucide-react';

interface CharacterSheetProps {
  character: Character;
  player?: User;
  onClose: () => void;
}

const getMod = (score: number) => Math.floor((score - 10) / 2);
const formatMod = (score: number) => { 
  const m = getMod(score); 
  return m >= 0 ? `+${m}` : `${m}`; 
};

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ character, player, onClose }) => {
  const [activeTab, setActiveTab] = useState<'actions' | 'equipment' | 'features' | 'bio'>('actions');
  const profBonus = character.proficiencyBonus || Math.ceil(character.level / 4) + 1;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto animate-in fade-in duration-200">
      <div className="min-h-screen p-4 md:p-8 flex justify-center">
        <div className="bg-fantasy-900 w-full max-w-5xl rounded-2xl border border-fantasy-700 shadow-2xl flex flex-col relative overflow-hidden">
          
          {/* Close / Minimize Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-fantasy-800 text-fantasy-muted hover:text-white rounded-full border border-fantasy-700 hover:border-fantasy-accent transition-all z-10"
            title="Minimize"
          >
            <Minimize2 size={20} />
          </button>

          {/* Header Section */}
          <div className="bg-fantasy-800 p-6 border-b border-fantasy-700 flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-fantasy-700 overflow-hidden border-2 border-fantasy-600 shadow-lg">
                 {character.imageUrl ? (
                   <img src={character.imageUrl} alt={character.name} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-fantasy-500"><UserIcon size={40}/></div>
                 )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-fantasy-accent text-fantasy-900 text-xs font-bold px-2 py-1 rounded-full border border-fantasy-900 shadow-sm">
                Lvl {character.level}
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-serif font-bold text-white mb-1">{character.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-fantasy-muted mb-2">
                <span className="bg-fantasy-900 px-3 py-1 rounded border border-fantasy-700 text-fantasy-text">{character.race}</span>
                <span className="bg-fantasy-900 px-3 py-1 rounded border border-fantasy-700 text-fantasy-text">{character.class}</span>
                <span className="bg-fantasy-900 px-3 py-1 rounded border border-fantasy-700 text-fantasy-text">{character.background || 'Unknown Background'}</span>
                <span className="bg-fantasy-900 px-3 py-1 rounded border border-fantasy-700 text-fantasy-text">{character.alignment || 'True Neutral'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-fantasy-muted">
                 {player ? (
                   <>
                     <img src={player.avatarUrl} className="w-4 h-4 rounded-full" />
                     <span>Played by <strong className="text-fantasy-text">{player.name}</strong></span>
                   </>
                 ) : (
                   <span>Unassigned Character</span>
                 )}
                 <span className="w-1 h-1 rounded-full bg-fantasy-700 mx-2"/>
                 <span>XP: {character.xp || 0}</span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0">
            
            {/* Left Column: Stats & Skills (3 cols) */}
            <div className="lg:col-span-3 bg-fantasy-800/50 border-r border-fantasy-700 p-4 space-y-6">
              {/* Ability Scores */}
              <div className="space-y-3">
                {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map(stat => (
                  <div key={stat} className="flex items-center justify-between bg-fantasy-900 p-2 rounded border border-fantasy-700/50">
                    <span className="font-bold text-fantasy-muted uppercase text-xs w-8">{stat}</span>
                    <span className="font-bold text-white text-lg">{character.stats[stat]}</span>
                    <span className="bg-fantasy-800 text-fantasy-accent px-2 py-0.5 rounded text-sm font-mono font-bold w-10 text-center">
                      {formatMod(character.stats[stat])}
                    </span>
                  </div>
                ))}
              </div>

              {/* Passive & Prof */}
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 rounded bg-fantasy-900/50 border border-fantasy-700/30">
                  <span className="text-xs text-fantasy-muted flex items-center gap-1"><Eye size={12}/> Passive Perc.</span>
                  <span className="font-bold text-white">{10 + getMod(character.stats.wis)}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-fantasy-900/50 border border-fantasy-700/30">
                  <span className="text-xs text-fantasy-muted flex items-center gap-1"><Brain size={12}/> Prof. Bonus</span>
                  <span className="font-bold text-fantasy-accent">+{profBonus}</span>
                </div>
              </div>

              {/* Skills List */}
              <div className="bg-fantasy-900 p-3 rounded-lg border border-fantasy-700/50">
                <h3 className="text-xs font-bold text-fantasy-muted uppercase mb-3">Skills</h3>
                {character.skills && character.skills.length > 0 ? (
                  <div className="space-y-1">
                    {character.skills.map((skill, i) => (
                      <div key={i} className="text-xs text-fantasy-text flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-fantasy-accent"></span>
                        {skill}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-fantasy-muted italic">No skills listed</p>
                )}
              </div>
            </div>

            {/* Middle Column: Combat & Main Tabs (6 cols) */}
            <div className="lg:col-span-6 p-4 md:p-6 bg-fantasy-900 flex flex-col gap-6">
              
              {/* Combat Stats Row */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-fantasy-800 p-3 rounded-xl border border-fantasy-700 flex flex-col items-center justify-center">
                  <span className="text-xs text-fantasy-muted uppercase font-bold mb-1 flex items-center gap-1"><Shield size={12}/> AC</span>
                  <span className="text-2xl font-bold text-white">{character.armorClass || 10 + getMod(character.stats.dex)}</span>
                </div>
                <div className="bg-fantasy-800 p-3 rounded-xl border border-fantasy-700 flex flex-col items-center justify-center">
                  <span className="text-xs text-fantasy-muted uppercase font-bold mb-1 flex items-center gap-1"><Zap size={12}/> Init</span>
                  <span className="text-2xl font-bold text-white">{character.initiative ? (character.initiative >= 0 ? `+${character.initiative}` : character.initiative) : formatMod(character.stats.dex)}</span>
                </div>
                <div className="bg-fantasy-800 p-3 rounded-xl border border-fantasy-700 flex flex-col items-center justify-center">
                  <span className="text-xs text-fantasy-muted uppercase font-bold mb-1 flex items-center gap-1"><Wind size={12}/> Speed</span>
                  <span className="text-2xl font-bold text-white">{character.speed || 30}<span className="text-xs text-fantasy-muted font-normal ml-1">ft</span></span>
                </div>
                <div className="bg-fantasy-800 p-3 rounded-xl border border-fantasy-700 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
                  <span className="text-xs text-fantasy-muted uppercase font-bold mb-1 flex items-center gap-1"><Heart size={12}/> HP</span>
                  <div className="flex items-baseline gap-1">
                     <span className="text-2xl font-bold text-white">{character.hp?.current ?? 0}</span>
                     <span className="text-xs text-fantasy-muted">/{character.hp?.max ?? 0}</span>
                  </div>
                  {character.hp?.temp ? (
                    <span className="text-[10px] text-blue-400 font-bold">+{character.hp.temp} Temp</span>
                  ) : null}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-fantasy-700">
                <button onClick={() => setActiveTab('actions')} className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'actions' ? 'border-fantasy-accent text-white' : 'border-transparent text-fantasy-muted hover:text-white'}`}>
                  <Sword size={14} /> Actions
                </button>
                <button onClick={() => setActiveTab('equipment')} className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'equipment' ? 'border-fantasy-accent text-white' : 'border-transparent text-fantasy-muted hover:text-white'}`}>
                  <Backpack size={14} /> Equipment
                </button>
                <button onClick={() => setActiveTab('features')} className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'features' ? 'border-fantasy-accent text-white' : 'border-transparent text-fantasy-muted hover:text-white'}`}>
                  <Scroll size={14} /> Features
                </button>
                <button onClick={() => setActiveTab('bio')} className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'bio' ? 'border-fantasy-accent text-white' : 'border-transparent text-fantasy-muted hover:text-white'}`}>
                  <UserIcon size={14} /> Bio
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto min-h-[300px]">
                {activeTab === 'actions' && (
                  <div className="space-y-4">
                    {character.attacks && character.attacks.length > 0 ? (
                      character.attacks.map((atk, idx) => (
                        <div key={idx} className="bg-fantasy-800 border border-fantasy-700 p-3 rounded-lg flex items-center justify-between group hover:border-fantasy-600 transition-colors">
                           <div>
                             <h4 className="font-bold text-white">{atk.name}</h4>
                             <span className="text-xs text-fantasy-muted italic">{atk.type}</span>
                           </div>
                           <div className="flex gap-4 text-sm">
                             <div className="text-center">
                               <span className="block text-[10px] text-fantasy-muted uppercase">Hit</span>
                               <span className="font-bold text-fantasy-accent">{atk.bonus}</span>
                             </div>
                             <div className="text-center">
                               <span className="block text-[10px] text-fantasy-muted uppercase">Dmg</span>
                               <span className="font-bold text-white">{atk.damage}</span>
                             </div>
                           </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-fantasy-muted italic text-center py-4">No attacks listed.</p>
                    )}
                  </div>
                )}

                {activeTab === 'equipment' && (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-fantasy-text">{character.equipment || "No equipment listed."}</p>
                  </div>
                )}

                {activeTab === 'features' && (
                  <div className="space-y-4">
                    <div className="bg-fantasy-800/50 p-3 rounded border border-fantasy-700/50">
                       <h4 className="font-bold text-white mb-1">Proficiencies & Languages</h4>
                       <p className="text-sm text-fantasy-text">{character.proficiencies || "Common"}</p>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none">
                       <h4 className="text-white font-bold mb-1">Features & Traits</h4>
                       <p className="whitespace-pre-wrap text-fantasy-text">{character.features || "No features listed."}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'bio' && (
                  <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-fantasy-800 p-3 rounded border border-fantasy-700">
                          <h5 className="text-xs font-bold text-fantasy-muted uppercase mb-1">Traits</h5>
                          <p className="text-sm text-fantasy-text italic">"{character.personality?.traits || '-'}"</p>
                        </div>
                        <div className="bg-fantasy-800 p-3 rounded border border-fantasy-700">
                          <h5 className="text-xs font-bold text-fantasy-muted uppercase mb-1">Ideals</h5>
                          <p className="text-sm text-fantasy-text">"{character.personality?.ideals || '-'}"</p>
                        </div>
                        <div className="bg-fantasy-800 p-3 rounded border border-fantasy-700">
                          <h5 className="text-xs font-bold text-fantasy-muted uppercase mb-1">Bonds</h5>
                          <p className="text-sm text-fantasy-text">"{character.personality?.bonds || '-'}"</p>
                        </div>
                        <div className="bg-fantasy-800 p-3 rounded border border-fantasy-700">
                          <h5 className="text-xs font-bold text-fantasy-muted uppercase mb-1">Flaws</h5>
                          <p className="text-sm text-fantasy-text">"{character.personality?.flaws || '-'}"</p>
                        </div>
                     </div>
                     <div>
                       <h5 className="font-bold text-white mb-2 border-b border-fantasy-700 pb-1">Backstory</h5>
                       <p className="text-sm text-fantasy-text leading-relaxed whitespace-pre-wrap">{character.bio || "No backstory provided."}</p>
                     </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: HP & Status (3 cols) - Visible on larger screens, merged on mobile */}
            <div className="lg:col-span-3 bg-fantasy-800/30 border-l border-fantasy-700 p-4 space-y-6">
              <div className="bg-fantasy-900 p-4 rounded-xl border border-fantasy-700">
                 <h3 className="text-xs font-bold text-fantasy-muted uppercase mb-3 text-center">Health & Vitality</h3>
                 <div className="flex justify-between items-center mb-4 border-b border-fantasy-800 pb-2">
                   <span className="text-sm text-fantasy-text">Hit Dice</span>
                   <div className="text-right">
                     <span className="block font-bold text-white">{character.hitDice?.current ?? character.level}/{character.level}</span>
                     <span className="text-xs text-fantasy-muted">{character.hitDice?.size ?? "d8"}</span>
                   </div>
                 </div>
                 
                 <div className="space-y-2">
                    <div className="flex justify-between items-center">
                       <span className="text-sm text-fantasy-text">Death Saves</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                       <span className="text-green-400 font-bold w-12">SUCCESS</span>
                       <div className="flex gap-1">
                          {[1,2,3].map(i => (
                            <div key={i} className={`w-3 h-3 rounded-full border border-fantasy-600 ${(character.deathSaves?.successes ?? 0) >= i ? 'bg-green-500' : 'bg-fantasy-800'}`} />
                          ))}
                       </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                       <span className="text-red-400 font-bold w-12">FAILURE</span>
                       <div className="flex gap-1">
                          {[1,2,3].map(i => (
                            <div key={i} className={`w-3 h-3 rounded-full border border-fantasy-600 ${(character.deathSaves?.failures ?? 0) >= i ? 'bg-red-500' : 'bg-fantasy-800'}`} />
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-fantasy-900 p-4 rounded-xl border border-fantasy-700 opacity-70">
                 <div className="text-center text-fantasy-muted text-sm py-8">
                   <p>Conditions / Effects</p>
                   <p className="text-xs italic mt-1">None active</p>
                 </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};