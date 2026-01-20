import React, { useState } from 'react';
import { User, Group, CalendarEvent, Campaign, UserRole } from '../types';
import { 
  Users, MessageSquare, Calendar as CalendarIcon, Dice5, 
  Settings, Plus, Lock, Video, Search, Bell, Shield, X, Check, Mail, Clock, ArrowLeft, Home,
  ChevronRight, MessageCircle, UserCog, Edit, Trash2, Link as LinkIcon, RefreshCw, Smartphone, Globe, LogOut
} from 'lucide-react';

interface SocialHubProps {
  currentUser: User;
  users: User[];
  groups: Group[];
  campaigns: Campaign[];
  events: CalendarEvent[];
  onLaunchDnD: () => void;
  onUpdateGroups: (groups: Group[]) => void;
  onUpdateUsers: (users: User[]) => void;
}

type HubView = 'home' | 'chat' | 'calendar' | 'groups' | 'users';

interface SimpleMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export const SocialHub: React.FC<SocialHubProps> = ({ 
  currentUser, users, groups, campaigns, events, onLaunchDnD, onUpdateGroups, onUpdateUsers
}) => {
  const [currentView, setCurrentView] = useState<HubView>('home');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  // Chat State
  const [activeChatGroupId, setActiveChatGroupId] = useState<string | null>(null);
  const [groupMessages, setGroupMessages] = useState<Record<string, SimpleMessage[]>>({
    'g1': [
      { id: 'm1', senderId: 'u2', senderName: 'Alice', text: 'Anyone up for a session this weekend?', timestamp: Date.now() - 3600000 },
      { id: 'm2', senderId: 'u3', senderName: 'Bob', text: 'I can do Saturday night.', timestamp: Date.now() - 1800000 }
    ],
    'g2': [
      { id: 'm3', senderId: 'u1', senderName: 'DM Admin', text: 'Updated the world map. Check it out.', timestamp: Date.now() - 86400000 }
    ]
  });
  const [chatInput, setChatInput] = useState('');

  // Modal States
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Partial<Group>>({});
  
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});

  const [showProfileModal, setShowProfileModal] = useState(false); // For editing own profile
  const [profileEdit, setProfileEdit] = useState<Partial<User>>({});

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFeedback, setInviteFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // --- Logic ---
  
  // Filter groups
  const visibleGroups = groups.filter(g => {
    const isMember = g.memberIds.includes(currentUser.id);
    const isAdmin = currentUser.role === 'admin';
    const isPublic = !g.isPrivate;
    return isMember || isAdmin || isPublic;
  });

  const myGroups = visibleGroups.filter(g => g.memberIds.includes(currentUser.id));

  // Access Control for D&D: User must be in at least one group or be admin/dm
  const hasDndAccess = myGroups.length > 0 || currentUser.role === 'admin' || currentUser.role === 'dungeon_master';

  // --- Chat Handlers ---
  const sendGroupMessage = (text: string) => {
    if (!activeChatGroupId || !text.trim()) return;
    const newMsg: SimpleMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: text,
      timestamp: Date.now()
    };
    setGroupMessages(prev => ({
      ...prev,
      [activeChatGroupId]: [...(prev[activeChatGroupId] || []), newMsg]
    }));
    setChatInput('');
  };

  // --- Group Handlers ---
  const handleSaveGroup = () => {
    if (!editingGroup.name) return;
    
    let updatedGroups = [...groups];
    if (editingGroup.id) {
      // Update
      updatedGroups = updatedGroups.map(g => g.id === editingGroup.id ? { ...g, ...editingGroup } as Group : g);
    } else {
      // Create
      const newGroup: Group = {
        id: Date.now().toString(),
        name: editingGroup.name,
        description: editingGroup.description || '',
        memberIds: [currentUser.id, ...(editingGroup.memberIds || [])],
        isPrivate: editingGroup.isPrivate || false,
        imageUrl: editingGroup.imageUrl,
        settings: editingGroup.settings,
        campaignId: editingGroup.campaignId
      };
      updatedGroups.push(newGroup);
    }
    onUpdateGroups(updatedGroups);
    setShowGroupModal(false);
    setEditingGroup({});
    setInviteEmail('');
    setInviteFeedback(null);
  };

  const toggleMember = (userId: string) => {
    const currentMembers = editingGroup.memberIds || [];
    if (currentMembers.includes(userId)) {
      setEditingGroup({ ...editingGroup, memberIds: currentMembers.filter(id => id !== userId) });
    } else {
      setEditingGroup({ ...editingGroup, memberIds: [...currentMembers, userId] });
    }
  };

  const handleInvite = () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setInviteFeedback({ msg: 'Please enter a valid email.', type: 'error' });
      return;
    }
    const existingUser = users.find(u => u.email.toLowerCase() === inviteEmail.toLowerCase().trim());
    
    if (existingUser) {
      if (editingGroup.memberIds?.includes(existingUser.id)) {
        setInviteFeedback({ msg: `${existingUser.name} is already in the group.`, type: 'error' });
      } else {
        setEditingGroup(prev => ({
          ...prev,
          memberIds: [...(prev.memberIds || []), existingUser.id]
        }));
        setInviteFeedback({ msg: `Added ${existingUser.name} to the group!`, type: 'success' });
      }
    } else {
      setInviteFeedback({ msg: `Invitation sent to ${inviteEmail}.`, type: 'success' });
    }
    setInviteEmail('');
    setTimeout(() => setInviteFeedback(null), 3000);
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setShowGroupModal(true);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm("Are you sure you want to delete this group?")) {
      onUpdateGroups(groups.filter(g => g.id !== groupId));
    }
  };

  // --- User Handlers (Admin) ---
  const handleSaveUser = () => {
    if (!editingUser.name) return;
    
    let updatedUsers = [...users];

    if (editingUser.id) {
      // Update Existing
      updatedUsers = users.map(u => u.id === editingUser.id ? { ...u, ...editingUser } as User : u);
    } else {
      // Create New
      const newUser: User = {
        id: Date.now().toString(),
        name: editingUser.name,
        email: editingUser.email || `user${Date.now()}@example.com`,
        avatarUrl: editingUser.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${editingUser.name}`,
        status: 'offline',
        role: editingUser.role || 'member'
      };
      updatedUsers.push(newUser);
    }

    onUpdateUsers(updatedUsers);
    setShowUserModal(false);
    setEditingUser({});
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      alert("You cannot delete yourself.");
      return;
    }
    if (window.confirm("Are you sure you want to remove this user? This cannot be undone.")) {
      onUpdateUsers(users.filter(u => u.id !== userId));
    }
  };

  const handleAddUser = () => {
    setEditingUser({ role: 'member', avatarUrl: '' });
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  // --- Profile Handlers (Self) ---
  const handleOpenProfile = () => {
    setProfileEdit({ ...currentUser });
    setShowProfileModal(true);
  };

  const handleSaveProfile = () => {
    if (!profileEdit.name) return;
    const updatedUser = { ...currentUser, ...profileEdit } as User;
    
    // Update in global users list
    const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    onUpdateUsers(updatedUsers);
    
    setShowProfileModal(false);
  };

  // --- Helper to render role label
  const renderRoleBadge = (role: UserRole) => {
    switch(role) {
      case 'admin':
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Admin</span>;
      case 'dungeon_master':
        return <span className="bg-fantasy-accent/20 text-fantasy-accent border border-fantasy-accent/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase">DM</span>;
      case 'member':
        return <span className="bg-fantasy-700 text-fantasy-muted px-2 py-0.5 rounded text-[10px] font-bold uppercase">Member</span>;
    }
  };

  // --- Views ---

  const HomeView = () => (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 p-1">
          <div>
              <h1 className="text-3xl font-serif font-bold text-white mb-1">Welcome, {currentUser.name}</h1>
              <p className="text-fantasy-muted">What would you like to do today?</p>
          </div>
          <div className="flex items-center gap-4">
              <button 
                onClick={handleOpenProfile}
                className="flex items-center gap-3 bg-fantasy-800 hover:bg-fantasy-700 p-2 rounded-full border border-fantasy-700 pr-4 transition-colors group"
                title="Edit Profile"
              >
                  <img src={currentUser.avatarUrl} className="w-8 h-8 rounded-full border border-fantasy-600 group-hover:border-fantasy-accent" />
                  <div className="text-sm text-left">
                      <div className="font-bold text-white group-hover:text-fantasy-accent transition-colors">{currentUser.name}</div>
                      <div className="text-[10px] text-fantasy-muted uppercase">{currentUser.status}</div>
                  </div>
                  <Settings size={14} className="text-fantasy-muted group-hover:text-white ml-2" />
              </button>
          </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto w-full flex-1 content-start pb-8">
          {/* Card 1: Chat / Meet */}
          <div 
            onClick={() => setCurrentView('chat')}
            className="group relative h-64 bg-fantasy-800 rounded-2xl border border-fantasy-700 p-8 flex flex-col justify-between cursor-pointer hover:border-blue-500/50 hover:bg-fantasy-800/80 transition-all overflow-hidden"
          >
             <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:bg-blue-500/20"></div>
             <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Chat & Meet</h3>
                <p className="text-fantasy-muted">Connect with your friends.</p>
             </div>
             <div className="flex items-center gap-2 text-blue-400 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
               <span>Open Chat</span> <ChevronRight size={16} />
             </div>
          </div>

          {/* Card 2: Calendar */}
          <div 
            onClick={() => setCurrentView('calendar')}
            className="group relative h-64 bg-fantasy-800 rounded-2xl border border-fantasy-700 p-8 flex flex-col justify-between cursor-pointer hover:border-purple-500/50 hover:bg-fantasy-800/80 transition-all overflow-hidden"
          >
             <div className="absolute top-0 right-0 p-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:bg-purple-500/20"></div>
             <div className="relative z-10">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                  <CalendarIcon size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Calendar</h3>
                <p className="text-fantasy-muted">Schedule sessions and track upcoming events.</p>
             </div>
             <div className="flex items-center gap-2 text-purple-400 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
               <span>View Schedule</span> <ChevronRight size={16} />
             </div>
          </div>

          {/* Card 3: Groups */}
          <div 
            onClick={() => setCurrentView('groups')}
            className="group relative h-64 bg-fantasy-800 rounded-2xl border border-fantasy-700 p-8 flex flex-col justify-between cursor-pointer hover:border-green-500/50 hover:bg-fantasy-800/80 transition-all overflow-hidden"
          >
             <div className="absolute top-0 right-0 p-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:bg-green-500/20"></div>
             <div className="relative z-10">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400 mb-4 group-hover:scale-110 transition-transform">
                  <Users size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Groups</h3>
                <p className="text-fantasy-muted">
                  {currentUser.role === 'admin' ? "Manage parties, members, and privacy settings." : "View your groups."}
                </p>
             </div>
             <div className="flex items-center gap-2 text-green-400 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
               <span>Manage Groups</span> <ChevronRight size={16} />
             </div>
          </div>

          {/* Card 4: D&D (Conditional) - Only render if access exists */}
          {hasDndAccess && (
            <div 
              onClick={onLaunchDnD}
              className="group relative h-64 bg-fantasy-800 rounded-2xl border border-fantasy-700 p-8 flex flex-col justify-between cursor-pointer hover:border-fantasy-accent/50 hover:bg-fantasy-800/80 transition-all overflow-hidden"
            >
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center opacity-70 group-hover:opacity-80 transition-opacity"></div>
               <div className="absolute inset-0 bg-gradient-to-t from-fantasy-900 to-transparent"></div>
               
               <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-fantasy-accent/20 rounded-xl flex items-center justify-center text-fantasy-accent mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-black/50">
                      <Dice5 size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">D&D Co-Pilot</h3>
                    <p className="text-fantasy-muted">Resume your campaign. Adventure awaits.</p>
                  </div>
                  <div className="flex items-center gap-2 text-fantasy-accent font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                     <span>Launch Tabletop</span> <ChevronRight size={16} />
                   </div>
               </div>
            </div>
          )}

          {/* Card 5: User Management (Admin Only) */}
          {currentUser.role === 'admin' && (
             <div 
               onClick={() => setCurrentView('users')}
               className="group relative h-64 bg-fantasy-800 rounded-2xl border border-fantasy-700 p-8 flex flex-col justify-between cursor-pointer hover:border-red-500/50 hover:bg-fantasy-800/80 transition-all overflow-hidden"
             >
                <div className="absolute top-0 right-0 p-32 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:bg-red-500/20"></div>
                <div className="relative z-10">
                   <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center text-red-400 mb-4 group-hover:scale-110 transition-transform">
                     <UserCog size={24} />
                   </div>
                   <h3 className="text-2xl font-bold text-white mb-2">User Management</h3>
                   <p className="text-fantasy-muted">Configure roles (Admin, DM, Member) and system access.</p>
                </div>
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                  <span>Manage Users</span> <ChevronRight size={16} />
                </div>
             </div>
          )}
      </div>
    </div>
  );

  const ChatView = () => {
    // Basic chat implementation
    const chatGroups = groups.filter(g => g.memberIds.includes(currentUser.id));
    const activeMessages = activeChatGroupId ? groupMessages[activeChatGroupId] || [] : [];
    
    return (
       <div className="flex h-full border border-fantasy-700 rounded-xl overflow-hidden bg-fantasy-800">
          <div className="w-1/3 border-r border-fantasy-700 bg-fantasy-800 flex flex-col">
             <div className="p-4 border-b border-fantasy-700 font-bold text-white">Channels</div>
             <div className="flex-1 overflow-y-auto">
                {chatGroups.map(g => (
                   <div 
                     key={g.id} 
                     onClick={() => setActiveChatGroupId(g.id)}
                     className={`p-3 cursor-pointer hover:bg-fantasy-700 transition-colors flex items-center gap-3 ${activeChatGroupId === g.id ? 'bg-fantasy-700' : ''}`}
                   >
                      <div className="w-10 h-10 rounded bg-fantasy-600 flex items-center justify-center flex-shrink-0">
                         {g.imageUrl ? <img src={g.imageUrl} className="w-full h-full object-cover rounded" /> : <Users size={20} />}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-bold text-white truncate">{g.name}</div>
                        <div className="text-xs text-fantasy-muted truncate">{g.isPrivate ? 'Private Group' : 'Public Group'}</div>
                      </div>
                   </div>
                ))}
                {chatGroups.length === 0 && <div className="p-4 text-sm text-fantasy-muted">No groups yet.</div>}
             </div>
          </div>
          <div className="flex-1 flex flex-col bg-fantasy-900">
             {activeChatGroupId ? (
               <>
                 <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {activeMessages.length === 0 && <div className="text-center text-fantasy-muted mt-10">No messages yet.</div>}
                    {activeMessages.map(msg => (
                       <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] px-4 py-2 rounded-xl text-sm ${msg.senderId === currentUser.id ? 'bg-fantasy-accent text-fantasy-900' : 'bg-fantasy-700 text-white'}`}>
                             <div className="text-[10px] opacity-70 mb-1">{msg.senderName}</div>
                             {msg.text}
                          </div>
                       </div>
                    ))}
                 </div>
                 <div className="p-4 border-t border-fantasy-700 bg-fantasy-800 flex gap-2">
                    <input 
                      className="flex-1 bg-fantasy-900 border border-fantasy-700 rounded-lg px-3 py-2 text-white focus:border-fantasy-accent outline-none"
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendGroupMessage(chatInput)}
                    />
                    <button onClick={() => sendGroupMessage(chatInput)} className="p-2 bg-fantasy-accent text-fantasy-900 rounded-lg hover:bg-opacity-90">
                      <MessageCircle size={20} />
                    </button>
                 </div>
               </>
             ) : (
               <div className="flex items-center justify-center h-full text-fantasy-muted">Select a group to chat</div>
             )}
          </div>
       </div>
    );
  };

  const CalendarView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
       <div className="lg:col-span-2 bg-fantasy-800 rounded-xl border border-fantasy-700 p-6 overflow-y-auto">
          <h3 className="text-xl font-bold text-white mb-6">Upcoming Sessions</h3>
          <div className="space-y-4">
             {events.map(ev => (
                <div key={ev.id} className="flex gap-4 p-4 bg-fantasy-900 rounded-lg border border-fantasy-700 border-l-4 border-l-fantasy-accent">
                   <div className="flex flex-col items-center justify-center px-4 border-r border-fantasy-700 text-fantasy-muted">
                      <span className="text-xs font-bold uppercase">{new Date(ev.startTime).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-2xl font-bold text-white">{new Date(ev.startTime).getDate()}</span>
                   </div>
                   <div>
                      <h4 className="font-bold text-white text-lg">{ev.title}</h4>
                      <p className="text-sm text-fantasy-muted flex items-center gap-2 mt-1">
                        <Clock size={14} /> 
                        {new Date(ev.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                        {new Date(ev.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                      {ev.location && <p className="text-sm text-fantasy-muted mt-1">{ev.location}</p>}
                   </div>
                </div>
             ))}
             {events.length === 0 && <p className="text-fantasy-muted">No upcoming events.</p>}
          </div>
       </div>
       <div className="bg-fantasy-800 rounded-xl border border-fantasy-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Calendar Sync</h3>
          <p className="text-sm text-fantasy-muted mb-6">Sync your sessions with external calendars.</p>
          <div className="space-y-3">
             <button className="w-full flex items-center justify-between p-3 bg-fantasy-900 rounded border border-fantasy-700 hover:border-fantasy-accent transition-colors">
                <span className="flex items-center gap-2"><Globe size={16} /> Google Calendar</span>
                {currentUser.calendarSettings?.provider === 'google' && <Check size={16} className="text-green-500" />}
             </button>
             <button className="w-full flex items-center justify-between p-3 bg-fantasy-900 rounded border border-fantasy-700 hover:border-fantasy-accent transition-colors">
                <span className="flex items-center gap-2"><Globe size={16} /> Outlook</span>
                {currentUser.calendarSettings?.provider === 'outlook' && <Check size={16} className="text-green-500" />}
             </button>
          </div>
       </div>
    </div>
  );

  const GroupsView = () => (
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full content-start overflow-y-auto pb-8">
        {groups.map(group => (
           <div key={group.id} className="bg-fantasy-800 rounded-xl border border-fantasy-700 overflow-hidden flex flex-col hover:border-fantasy-accent transition-colors">
              <div className="h-32 bg-fantasy-700 relative">
                 {group.imageUrl ? <img src={group.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Users size={40} className="text-fantasy-500"/></div>}
                 {group.isPrivate && <div className="absolute top-2 right-2 bg-black/60 p-1 rounded text-white"><Lock size={14} /></div>}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                 <h3 className="font-bold text-white text-lg">{group.name}</h3>
                 <p className="text-sm text-fantasy-muted mb-4 line-clamp-2">{group.description}</p>
                 <div className="mt-auto flex justify-between items-center pt-4 border-t border-fantasy-700">
                    <span className="text-xs text-fantasy-muted">{group.memberIds.length} members</span>
                    {currentUser.role === 'admin' && (
                       <div className="flex gap-2">
                          <button onClick={() => handleEditGroup(group)} className="p-1.5 text-fantasy-muted hover:text-white hover:bg-fantasy-700 rounded"><Edit size={16} /></button>
                          <button onClick={() => handleDeleteGroup(group.id)} className="p-1.5 text-fantasy-muted hover:text-red-400 hover:bg-fantasy-700 rounded"><Trash2 size={16} /></button>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        ))}
     </div>
  );

  const UsersView = () => (
    <div className="bg-fantasy-800 rounded-xl border border-fantasy-700 overflow-hidden flex flex-col h-full">
       <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
             <thead>
                <tr className="bg-fantasy-700/50 text-fantasy-muted text-xs uppercase border-b border-fantasy-700">
                   <th className="p-4 font-bold">User</th>
                   <th className="p-4 font-bold">Email</th>
                   <th className="p-4 font-bold">Status</th>
                   <th className="p-4 font-bold">Role</th>
                   <th className="p-4 font-bold text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-fantasy-700">
                {users.map(u => (
                   <tr key={u.id} className="hover:bg-fantasy-700/30 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                         <img src={u.avatarUrl} className="w-8 h-8 rounded-full" />
                         <span className="font-bold text-white">{u.name}</span>
                      </td>
                      <td className="p-4 text-fantasy-text text-sm">{u.email}</td>
                      <td className="p-4">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${u.status === 'online' ? 'bg-green-500/10 text-green-500 border-green-500/20' : u.status === 'in-game' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                            {u.status}
                         </span>
                      </td>
                      <td className="p-4 text-fantasy-text text-sm">
                        {renderRoleBadge(u.role)}
                      </td>
                      <td className="p-4 text-right">
                         <button onClick={() => handleEditUser(u)} className="p-1.5 text-fantasy-muted hover:text-white"><Edit size={16} /></button>
                         <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 text-fantasy-muted hover:text-red-400"><Trash2 size={16} /></button>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  // Return main structure
  return (
    <div className="flex h-screen bg-fantasy-900 text-fantasy-text overflow-hidden font-sans">
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {currentView !== 'home' && (
           <header className="h-16 bg-fantasy-800 border-b border-fantasy-700 flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-4">
                 <button onClick={() => setCurrentView('home')} className="p-2 hover:bg-fantasy-700 rounded-full text-fantasy-muted hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                 </button>
                 <h2 className="text-xl font-bold text-white capitalize flex items-center gap-2">
                    <Home size={16} className="text-fantasy-muted" /> / {currentView}
                 </h2>
              </div>
              <div className="flex items-center gap-3">
                 {currentView === 'groups' && currentUser.role === 'admin' && (
                   <button onClick={() => { setEditingGroup({}); setShowGroupModal(true); }} className="flex items-center gap-2 bg-fantasy-accent text-fantasy-900 px-3 py-1.5 rounded-lg text-sm font-bold">
                     <Plus size={16} /> New Group
                   </button>
                 )}
                 {currentView === 'users' && currentUser.role === 'admin' && (
                   <button onClick={handleAddUser} className="flex items-center gap-2 bg-fantasy-accent text-fantasy-900 px-3 py-1.5 rounded-lg text-sm font-bold">
                     <Plus size={16} /> Add User
                   </button>
                 )}
              </div>
           </header>
        )}

        <main className="flex-1 overflow-hidden relative bg-fantasy-900 p-4 md:p-6">
           {currentView === 'home' && <HomeView />}
           {currentView === 'chat' && <ChatView />}
           {currentView === 'calendar' && <CalendarView />}
           {currentView === 'groups' && <GroupsView />}
           {currentView === 'users' && <UsersView />}
        </main>
      </div>

      {/* Modals Implementation */}
      
      {/* Group Modal */}
      {showGroupModal && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-fantasy-800 rounded-xl border border-fantasy-700 p-6 w-full max-w-md">
               <h3 className="text-xl font-bold text-white mb-4">{editingGroup.id ? 'Edit Group' : 'New Group'}</h3>
               <div className="space-y-4">
                  <div>
                     <label className="text-xs font-bold text-fantasy-muted uppercase">Name</label>
                     <input className="w-full bg-fantasy-900 border border-fantasy-700 rounded p-2 text-white outline-none" value={editingGroup.name || ''} onChange={e => setEditingGroup({...editingGroup, name: e.target.value})} />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-fantasy-muted uppercase">Description</label>
                     <textarea className="w-full bg-fantasy-900 border border-fantasy-700 rounded p-2 text-white outline-none h-20 resize-none" value={editingGroup.description || ''} onChange={e => setEditingGroup({...editingGroup, description: e.target.value})} />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-fantasy-muted uppercase">Cover Image URL</label>
                     <input className="w-full bg-fantasy-900 border border-fantasy-700 rounded p-2 text-white outline-none" value={editingGroup.imageUrl || ''} onChange={e => setEditingGroup({...editingGroup, imageUrl: e.target.value})} />
                  </div>
                  
                  {/* Member Management if Editing */}
                  {editingGroup.id && (
                    <div className="pt-2 border-t border-fantasy-700">
                       <label className="text-xs font-bold text-fantasy-muted uppercase block mb-2">Members & Invite</label>
                       <div className="flex gap-2 mb-2">
                          <input 
                            className="flex-1 bg-fantasy-900 border border-fantasy-700 rounded p-2 text-white outline-none text-sm" 
                            placeholder="user@example.com" 
                            value={inviteEmail} 
                            onChange={e => setInviteEmail(e.target.value)}
                          />
                          <button onClick={handleInvite} className="bg-fantasy-700 hover:bg-fantasy-600 text-white px-3 rounded text-sm font-bold"><Mail size={16}/></button>
                       </div>
                       {inviteFeedback && (
                          <div className={`text-xs mb-2 ${inviteFeedback.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{inviteFeedback.msg}</div>
                       )}
                       <div className="max-h-32 overflow-y-auto bg-fantasy-900 rounded border border-fantasy-700 p-2 space-y-1">
                          {users.map(u => (
                             <div key={u.id} className="flex items-center justify-between text-sm p-1 hover:bg-fantasy-800 rounded cursor-pointer" onClick={() => toggleMember(u.id)}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded border ${editingGroup.memberIds?.includes(u.id) ? 'bg-fantasy-accent border-fantasy-accent' : 'border-fantasy-600'}`}></div>
                                  <span className={editingGroup.memberIds?.includes(u.id) ? 'text-white' : 'text-fantasy-muted'}>{u.name}</span>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                     <input type="checkbox" id="isPrivate" checked={editingGroup.isPrivate || false} onChange={e => setEditingGroup({...editingGroup, isPrivate: e.target.checked})} className="rounded bg-fantasy-900 border-fantasy-700 text-fantasy-accent" />
                     <label htmlFor="isPrivate" className="text-sm text-white">Private Group (Airlocked)</label>
                  </div>
               </div>
               <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowGroupModal(false)} className="flex-1 py-2 text-fantasy-muted hover:text-white">Cancel</button>
                  <button onClick={handleSaveGroup} className="flex-1 py-2 bg-fantasy-accent text-fantasy-900 font-bold rounded">Save</button>
               </div>
            </div>
         </div>
      )}

      {/* User Modal */}
      {showUserModal && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-fantasy-800 rounded-xl border border-fantasy-700 p-6 w-full max-w-md">
               <h3 className="text-xl font-bold text-white mb-4">{editingUser.id ? 'Edit User' : 'Add User'}</h3>
               <div className="space-y-4">
                  <div>
                     <label className="text-xs font-bold text-fantasy-muted uppercase">Name</label>
                     <input className="w-full bg-fantasy-900 border border-fantasy-700 rounded p-2 text-white outline-none" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-fantasy-muted uppercase">Email</label>
                     <input className="w-full bg-fantasy-900 border border-fantasy-700 rounded p-2 text-white outline-none" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-fantasy-muted uppercase">System Role</label>
                     <select 
                       className="w-full bg-fantasy-900 border border-fantasy-700 rounded p-2 text-white outline-none"
                       value={editingUser.role || 'member'}
                       onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                     >
                       <option value="member">Member</option>
                       <option value="dungeon_master">Dungeon Master</option>
                       <option value="admin">Administrator</option>
                     </select>
                     <p className="text-xs text-fantasy-muted mt-1">
                       {editingUser.role === 'admin' && 'Full access to system settings and user management.'}
                       {editingUser.role === 'dungeon_master' && 'Access to AI Co-Pilot and campaign tools.'}
                       {editingUser.role === 'member' && 'Standard player access.'}
                     </p>
                  </div>
               </div>
               <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowUserModal(false)} className="flex-1 py-2 text-fantasy-muted hover:text-white">Cancel</button>
                  <button onClick={handleSaveUser} className="flex-1 py-2 bg-fantasy-accent text-fantasy-900 font-bold rounded">Save</button>
               </div>
            </div>
         </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-fantasy-800 rounded-xl border border-fantasy-700 p-6 w-full max-w-md">
               <h3 className="text-xl font-bold text-white mb-4">Edit Profile</h3>
               <div className="space-y-4">
                  <div className="flex justify-center mb-4">
                     <img src={profileEdit.avatarUrl} className="w-20 h-20 rounded-full border-2 border-fantasy-accent" />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-fantasy-muted uppercase">Display Name</label>
                     <input className="w-full bg-fantasy-900 border border-fantasy-700 rounded p-2 text-white outline-none" value={profileEdit.name || ''} onChange={e => setProfileEdit({...profileEdit, name: e.target.value})} />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-fantasy-muted uppercase">Avatar URL</label>
                     <input className="w-full bg-fantasy-900 border border-fantasy-700 rounded p-2 text-white outline-none" value={profileEdit.avatarUrl || ''} onChange={e => setProfileEdit({...profileEdit, avatarUrl: e.target.value})} />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-fantasy-muted uppercase">Status</label>
                     <select 
                        className="w-full bg-fantasy-900 border border-fantasy-700 rounded p-2 text-white outline-none"
                        value={profileEdit.status}
                        onChange={e => setProfileEdit({...profileEdit, status: e.target.value as any})}
                     >
                        <option value="online">Online</option>
                        <option value="busy">Busy</option>
                        <option value="offline">Offline</option>
                        <option value="in-game">In-Game</option>
                     </select>
                  </div>
               </div>
               <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowProfileModal(false)} className="flex-1 py-2 text-fantasy-muted hover:text-white">Cancel</button>
                  <button onClick={handleSaveProfile} className="flex-1 py-2 bg-fantasy-accent text-fantasy-900 font-bold rounded">Save Changes</button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};