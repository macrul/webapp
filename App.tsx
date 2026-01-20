import React, { useState } from 'react';
import { Dice5, LayoutDashboard, Users as UsersIcon, Clock, MessageSquare, LogOut, Sparkles, Video, Calendar, Copy, Check, MessageCircle, Home, Eye, Shield, Trophy } from 'lucide-react';
import { Campaign, User, DMThread, DirectMessage, Group, CalendarEvent } from './types';
import { CampaignLobby } from './components/CampaignLobby';
import { AIChat } from './components/AIChat';
import { CharacterManager } from './components/CharacterManager';
import { SessionLogger } from './components/SessionLogger';
import { PlayerChat } from './components/PlayerChat';
import { DirectMessaging } from './components/DirectMessaging';
import { SocialHub } from './components/SocialHub';
import { LoginPage } from './components/LoginPage';
import { INITIAL_GREETING } from './constants';

type View = 'copilot' | 'characters' | 'logs' | 'chat';

// Admin Domain Rule: Only emails from this domain receive Admin privileges.
const ADMIN_DOMAIN = '@macrul.com';

// Mock Users Data
// Roles: 'admin', 'dungeon_master', 'member'
const MOCK_USERS: User[] = [
  { id: 'u1', name: 'DM Admin', email: 'dm@macrul.com', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Admin', status: 'online' as const, calendarSettings: { syncEnabled: true, provider: 'google' as const, privacyLevel: 'full-details' as const }, role: 'admin' },
  { id: 'u2', name: 'Alice Walker', email: 'alice@example.com', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alice', status: 'in-game' as const, calendarSettings: { syncEnabled: true, provider: 'google' as const, privacyLevel: 'free-busy' as const }, role: 'member' },
  { id: 'u3', name: 'Bob Builder', email: 'bob@example.com', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Bob', status: 'offline' as const, role: 'member' },
  { id: 'u4', name: 'Charlie Day', email: 'charlie@example.com', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Charlie', status: 'busy' as const, role: 'member' },
  { id: 'u5', name: 'Eve Stranger', email: 'eve@example.com', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Eve', status: 'online' as const, role: 'dungeon_master' }, // Not in main group, but a DM
];

const MOCK_GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'The Obsidian Spires',
    description: 'Weekly D&D sessions. Level 5 campaign.',
    memberIds: ['u1', 'u2', 'u3', 'u4'],
    isPrivate: false,
    imageUrl: 'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?q=80&w=200&auto=format&fit=crop',
    campaignId: 'demo-1'
  },
  {
    id: 'g2',
    name: 'Secret Council',
    description: 'DM Planning and Worldbuilding group.',
    memberIds: ['u1'], // Only admin
    isPrivate: true, // Airlocked
  }
];

const MOCK_EVENTS: CalendarEvent[] = [
  { id: 'e1', title: 'D&D Session 4', startTime: Date.now() + 86400000, endTime: Date.now() + 97200000, type: 'dnd', groupId: 'g1' },
  { id: 'e2', title: 'Character Creation', startTime: Date.now() + 172800000, endTime: Date.now() + 180000000, type: 'dnd', groupId: 'g1' }
];

export default function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // App Mode State
  const [isInDnDMode, setIsInDnDMode] = useState(false);
  
  // D&D App State
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('chat'); // Default to Tabletop Chat
  const [copiedCode, setCopiedCode] = useState(false);
  const [showDMs, setShowDMs] = useState(false);
  
  // Database State
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]); 
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
  const [events, setEvents] = useState<CalendarEvent[]>(MOCK_EVENTS);

  const [dms, setDms] = useState<DMThread[]>([
    {
      id: 't1',
      participantIds: ['u1', 'u2'],
      lastUpdated: Date.now() - 100000,
      unreadCount: 1,
      messages: [
        { id: 'm1', senderId: 'u2', content: 'Hey DM! Can I switch my subclass?', timestamp: Date.now() - 100000 }
      ]
    }
  ]);

  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: 'demo-1',
      name: 'The Obsidian Spire',
      inviteCode: 'XY92KA',
      description: 'A level 5 adventure into the depths of a volcano.',
      characters: [
         { 
           id: 'c1', 
           name: 'Kael', 
           race: 'Elf', 
           class: 'Rogue', 
           level: 5, 
           background: 'Criminal', 
           stats: { str: 10, dex: 18, con: 12, int: 14, wis: 10, cha: 13 },
           bio: 'A master of shadows. Kael seeks to redeem his family name after a heist gone wrong.',
           imageUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Kael',
           playerId: 'u2',
           inviteStatus: 'accepted',
           alignment: 'Chaotic Good',
           xp: 6500,
           armorClass: 16,
           speed: 35,
           initiative: 4,
           hp: { current: 38, max: 38, temp: 0 },
           hitDice: { total: 5, current: 5, size: 'd8' },
           skills: ['Acrobatics +7', 'Stealth +10', 'Perception +3', 'Deception +4'],
           proficiencies: 'Thieves Tools, Elvish, Common',
           attacks: [
             { name: 'Rapier', bonus: '+7', damage: '1d8+4', type: 'Piercing' },
             { name: 'Shortbow', bonus: '+7', damage: '1d6+4', type: 'Piercing' },
             { name: 'Dagger', bonus: '+7', damage: '1d4+4', type: 'Piercing' }
           ],
           equipment: "Leather Armor, Rapier, Shortbow, 20 Arrows, Burglar's Pack, Thieves Tools, Cloak of Protection",
           features: "**Sneak Attack (3d6)**\nOnce per turn, you can deal an extra 3d6 damage to one creature you hit with an attack...\n\n**Cunning Action**\nYou can take a Bonus Action on each of your turns in combat to Dash, Disengage, or Hide.",
           personality: {
             traits: "I always have a plan for what to do when things go wrong.",
             ideals: "Freedom. Chains are meant to be broken.",
             bonds: "My sister is missing, and I will find her.",
             flaws: "I can't resist a shiny object."
           }
         },
         { 
           id: 'c2', 
           name: 'Brog', 
           race: 'Orc', 
           class: 'Barbarian', 
           level: 5, 
           background: 'Outlander', 
           stats: { str: 18, dex: 14, con: 16, int: 8, wis: 10, cha: 10 },
           bio: 'Brog left his tribe to find a worthy opponent. He loves shiny rocks and hates goblins.',
           imageUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Brog',
           playerId: 'u3',
           inviteStatus: 'accepted',
           alignment: 'True Neutral',
           xp: 6500,
           armorClass: 15,
           speed: 40,
           initiative: 2,
           hp: { current: 55, max: 55, temp: 0 },
           hitDice: { total: 5, current: 4, size: 'd12' },
           skills: ['Athletics +7', 'Survival +3', 'Intimidation +3'],
           proficiencies: 'Common, Orc, Drum',
           attacks: [
             { name: 'Greataxe', bonus: '+7', damage: '1d12+4', type: 'Slashing' },
             { name: 'Javelin', bonus: '+7', damage: '1d6+4', type: 'Piercing' }
           ],
           equipment: "Greataxe, 2 Handaxes, Explorer's Pack, 4 Javelins",
           features: "**Rage**\nIn battle, you fight with primal ferocity.\n\n**Reckless Attack**\nYou can throw aside all concern for defense to attack with fierce desperation.\n\n**Extra Attack**\nYou can attack twice, instead of once.",
           personality: {
             traits: "I watch over my friends as if they were a litter of newborn pups.",
             ideals: "Glory. I must earn glory in battle, for myself and my clan.",
             bonds: "I will bring terrible wrath down on the evildoers who destroyed my homeland.",
             flaws: "I have a weakness for the vices of the city, especially hard drink."
           }
         }
      ],
      logs: [],
      playerChat: [],
      aiChatHistory: [{ id: 'init', role: 'model', content: INITIAL_GREETING, timestamp: Date.now() }],
      bannerUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1600&auto=format&fit=crop'
    }
  ]);

  const activeCampaign = campaigns.find(c => c.id === activeCampaignId);

  // --- Handlers ---

  const handleLogin = () => {
    // In a real app, this would come from the auth provider result
    // For now, we simulate logging in as the main Admin User
    setCurrentUser(MOCK_USERS[0]);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsInDnDMode(false);
    setActiveCampaignId(null);
  };

  const handleLaunchDnD = () => {
    setIsInDnDMode(true);
    // When launching, reset view to Chat
    setActiveView('chat');
  };

  const handleExitDnD = () => {
    setIsInDnDMode(false);
    setActiveCampaignId(null);
  };

  const handleSendMessage = (threadId: string, content: string) => {
    const newMsg: DirectMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      content,
      timestamp: Date.now()
    };
    
    setDms(prev => prev.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          messages: [...t.messages, newMsg],
          lastUpdated: Date.now(),
          unreadCount: 0
        };
      }
      return t;
    }));
  };

  const handleCreateThread = (targetUserId: string) => {
    const existing = dms.find(t => t.participantIds.includes(targetUserId) && t.participantIds.includes(currentUser.id));
    if (existing) return;

    const newThread: DMThread = {
      id: `thread-${Date.now()}`,
      participantIds: [currentUser.id, targetUserId],
      messages: [],
      lastUpdated: Date.now(),
      unreadCount: 0
    };
    setDms([...dms, newThread]);
  };

  const handleUpdateCampaign = (updated: Campaign) => {
    setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleAddCampaign = (newCampaign: Campaign) => {
    setCampaigns([...campaigns, newCampaign]);
    setActiveCampaignId(newCampaign.id);
  };

  const copyInviteCode = () => {
    if (!activeCampaign) return;
    navigator.clipboard.writeText(`https://dmcopilot.app/join/${activeCampaign.inviteCode}`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatRole = (role: string) => {
    switch(role) {
      case 'dungeon_master': return '(DM)';
      case 'admin': return '(Admin)';
      default: return '';
    }
  };

  const UserSwitcher = () => (
    <div className="fixed bottom-4 right-4 z-[100] bg-fantasy-900/95 border border-fantasy-accent/30 rounded-lg p-3 shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 group hover:opacity-100 opacity-50 transition-opacity">
      <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-1">
         <Eye size={12} className="text-fantasy-accent" />
         <span className="text-[10px] text-fantasy-accent uppercase font-bold tracking-wider">Preview As</span>
      </div>
      <div className="flex items-center gap-2">
        <img src={currentUser.avatarUrl} className="w-6 h-6 rounded-full border border-fantasy-600" />
        <select 
          className="w-40 bg-fantasy-800 text-white text-xs p-1.5 rounded border border-fantasy-700 outline-none focus:border-fantasy-accent cursor-pointer"
          value={currentUser.id}
          onChange={(e) => {
            const u = users.find(u => u.id === e.target.value);
            if (u) {
              setCurrentUser(u);
              // If user switches to member while on copilot, redirect to chat
              if (u.role === 'member' && activeView === 'copilot') {
                setActiveView('chat');
              }
            }
          }}
        >
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.name} {formatRole(u.role)}
            </option>
          ))}
        </select>
        <button onClick={handleLogout} className="p-1.5 hover:text-red-400 text-fantasy-muted" title="Log Out">
           <LogOut size={14} />
        </button>
      </div>
    </div>
  );

  // --- Render ---

  // Auth Gate
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (!isInDnDMode) {
    return (
      <>
        <UserSwitcher />
        <SocialHub 
          currentUser={currentUser}
          users={users}
          groups={groups}
          campaigns={campaigns}
          events={events}
          onLaunchDnD={handleLaunchDnD}
          onUpdateGroups={setGroups}
          onUpdateUsers={setUsers}
        />
      </>
    );
  }

  // D&D Application Layout
  return (
    <div className="flex h-screen bg-fantasy-900 text-fantasy-text overflow-hidden font-sans relative">
      <UserSwitcher />
      
      {/* Global Direct Messaging Overlay */}
      {showDMs && (
        <DirectMessaging 
          currentUser={currentUser}
          users={users}
          threads={dms}
          onClose={() => setShowDMs(false)}
          onSendMessage={handleSendMessage}
          onCreateThread={handleCreateThread}
        />
      )}

      {/* Render: Campaign Lobby (Dashboard) OR Active Campaign */}
      {!activeCampaignId || !activeCampaign ? (
        <div className="flex-1 flex flex-col relative">
           {/* Top Nav for Dashboard */}
           <header className="p-4 bg-fantasy-800 border-b border-fantasy-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={handleExitDnD} className="hover:text-white transition-colors">
                  <Home size={20} />
                </button>
                <div className="h-6 w-px bg-fantasy-700 mx-2"></div>
                <div className="w-8 h-8 bg-fantasy-accent/10 rounded flex items-center justify-center">
                  <Dice5 className="text-fantasy-accent" />
                </div>
                <span className="font-serif font-bold text-lg text-white">DM Co-Pilot</span>
              </div>
              
              <div className="flex items-center gap-4">
                 <button 
                   onClick={() => setShowDMs(true)}
                   className="flex items-center gap-2 bg-fantasy-700 hover:bg-fantasy-600 px-3 py-1.5 rounded-full text-white text-sm transition-colors relative"
                 >
                    <MessageCircle size={16} />
                    <span>Messages</span>
                    {dms.some(t => t.unreadCount > 0) && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-fantasy-800"></span>
                    )}
                 </button>
                 <div className="flex items-center gap-2">
                    <img src={currentUser.avatarUrl} className="w-8 h-8 rounded-full border border-fantasy-600" />
                    <span className="text-sm font-bold">{currentUser.name}</span>
                 </div>
              </div>
           </header>

           <div className="flex-1 overflow-auto bg-fantasy-900">
              <CampaignLobby 
                campaigns={campaigns} 
                onCreate={handleAddCampaign} 
                onSelect={setActiveCampaignId} 
              />
           </div>
        </div>
      ) : (
        /* Active Campaign Layout */
        <>
          {/* Sidebar */}
          <aside className="w-20 lg:w-64 bg-fantasy-800 border-r border-fantasy-700 flex flex-col flex-shrink-0 z-20">
            <div className="p-4 border-b border-fantasy-700 flex items-center gap-3">
              <div className="w-10 h-10 bg-fantasy-accent/10 rounded-lg flex-shrink-0 flex items-center justify-center border border-fantasy-accent/20">
                <Dice5 className="text-fantasy-accent" />
              </div>
              <div className="hidden lg:block overflow-hidden">
                <h1 className="font-serif font-bold text-white truncate">{activeCampaign.name}</h1>
                <button onClick={copyInviteCode} className="text-xs text-fantasy-muted flex items-center gap-1 hover:text-white transition-colors group">
                  Code: <span className="font-mono text-fantasy-accent">{activeCampaign.inviteCode}</span>
                  {copiedCode ? <Check size={10} className="text-green-400" /> : <Copy size={10} className="opacity-0 group-hover:opacity-100" />}
                </button>
              </div>
            </div>

            <nav className="flex-1 p-2 space-y-1">
              <NavItem active={activeView === 'chat'} onClick={() => setActiveView('chat')} icon={<MessageSquare size={20}/>} label="Tabletop Chat" />
              <NavItem active={activeView === 'characters'} onClick={() => setActiveView('characters')} icon={<UsersIcon size={20}/>} label="Characters" />
              <NavItem active={activeView === 'logs'} onClick={() => setActiveView('logs')} icon={<Clock size={20}/>} label="Session Logs" />
              
              {/* Admins and DMs can access the AI Co-Pilot */}
              {(currentUser.role === 'admin' || currentUser.role === 'dungeon_master') && (
                <NavItem active={activeView === 'copilot'} onClick={() => setActiveView('copilot')} icon={<Sparkles size={20}/>} label="AI Co-Pilot" />
              )}
            </nav>

            <div className="p-4 border-t border-fantasy-700 space-y-2">
               {/* Direct Messages Button in Sidebar */}
               <button 
                  onClick={() => setShowDMs(true)}
                  className="flex items-center gap-3 text-fantasy-text hover:text-white hover:bg-fantasy-700 w-full p-2 rounded-lg transition-colors relative"
               >
                  <MessageCircle size={20} />
                  <span className="hidden lg:block font-medium">Messages</span>
                  {dms.some(t => t.unreadCount > 0) && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
               </button>
               
               <button onClick={() => setActiveCampaignId(null)} className="flex items-center gap-3 text-fantasy-muted hover:text-red-400 w-full p-2 rounded-lg transition-colors">
                  <LogOut size={20} />
                  <span className="hidden lg:block font-medium">Exit Campaign</span>
               </button>
            </div>
          </aside>

          {/* Main Content Wrapper */}
          <div className="flex-1 flex flex-col overflow-hidden relative bg-fantasy-900">
            {/* Clash Royale Style Campaign Banner */}
            {activeCampaign.bannerUrl ? (
               <div className="relative shrink-0 w-full h-40 bg-fantasy-900 border-b-4 border-fantasy-accent shadow-xl overflow-hidden group">
                  {/* Background Image with Zoom Effect */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" 
                    style={{ backgroundImage: `url(${activeCampaign.bannerUrl})` }}
                  ></div>
                  
                  {/* Gradients/Overlay for Depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80"></div>

                  {/* Top Bar (Home Button) */}
                   <div className="absolute top-4 right-4 z-20">
                     <button 
                       onClick={handleExitDnD}
                       className="bg-black/50 hover:bg-fantasy-accent hover:text-fantasy-900 text-white p-2 rounded-xl backdrop-blur-md border border-white/20 transition-all shadow-lg hover:shadow-fantasy-accent/20"
                       title="Back to Home"
                     >
                        <Home size={20} />
                     </button>
                  </div>
                  
                  {/* Banner Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end items-start z-10">
                     {/* Decorative Tag */}
                     <div className="mb-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-fantasy-accent text-fantasy-900 text-[10px] font-bold uppercase tracking-wider rounded border border-white/20 shadow-lg">
                           Campaign
                        </span>
                        {activeCampaign.isAiDm && (
                           <span className="px-2 py-0.5 bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wider rounded border border-white/20 shadow-lg flex items-center gap-1">
                              <Sparkles size={8} /> AI DM
                           </span>
                        )}
                     </div>

                     <div className="flex items-end justify-between w-full">
                       <div>
                          <h2 
                            className="text-4xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]"
                            style={{ textShadow: '2px 2px 0px #000' }}
                          >
                            {activeCampaign.name}
                          </h2>
                          <div className="flex items-center gap-4 mt-2 text-sm font-medium text-gray-200">
                             <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-lg border border-white/10 backdrop-blur-sm">
                                <Shield size={14} className="text-fantasy-accent"/>
                                <span>Level 5</span>
                             </div>
                             <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-lg border border-white/10 backdrop-blur-sm">
                                <Trophy size={14} className="text-yellow-400"/>
                                <span>{activeCampaign.characters.length} Heroes</span>
                             </div>
                          </div>
                       </div>
                     </div>
                  </div>
               </div>
            ) : (
               /* Fallback Header */
               <div className="h-16 bg-fantasy-800 border-b border-fantasy-700 flex items-center justify-between px-6 shrink-0">
                  <h2 className="text-xl font-serif font-bold text-white">{activeCampaign.name}</h2>
                  <button 
                       onClick={handleExitDnD}
                       className="text-fantasy-muted hover:text-white transition-colors p-2 hover:bg-fantasy-700 rounded-full"
                       title="Back to Home"
                  >
                        <Home size={20} />
                  </button>
               </div>
            )}

            {/* View Container */}
            <main className="flex-1 overflow-hidden relative">
              {(currentUser.role === 'admin' || currentUser.role === 'dungeon_master') && activeView === 'copilot' && (
                <AIChat campaign={activeCampaign} onUpdateCampaign={handleUpdateCampaign} />
              )}
              {activeView === 'characters' && (
                <CharacterManager campaign={activeCampaign} users={users} onUpdateCampaign={handleUpdateCampaign} />
              )}
              {activeView === 'logs' && (
                <SessionLogger campaign={activeCampaign} onUpdateCampaign={handleUpdateCampaign} />
              )}
              {activeView === 'chat' && (
                <PlayerChat campaign={activeCampaign} onUpdateCampaign={handleUpdateCampaign} />
              )}
            </main>
          </div>
        </>
      )}
    </div>
  );
}

const NavItem = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${active ? 'bg-fantasy-700 text-white shadow-md' : 'text-fantasy-muted hover:bg-fantasy-700/50 hover:text-fantasy-text'}`}
  >
    <div className={`${active ? 'text-fantasy-accent' : ''}`}>{icon}</div>
    <span className="hidden lg:block font-medium text-sm">{label}</span>
  </button>
);