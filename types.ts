export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  isPanicResponse?: boolean;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  title: string;
}

export enum CardType {
  NPC = 'NPC CARD',
  LOCATION = 'LOCATION CARD',
  QUEST = 'QUEST CARD',
  ENCOUNTER = 'ENCOUNTER CARD',
  ITEM = 'ITEM CARD',
  UNKNOWN = 'UNKNOWN'
}

export interface ExtractedCard {
  type: CardType;
  content: string;
}

// --- User Management & DM Types ---

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  status: 'online' | 'offline' | 'busy' | 'in-game';
  isAdmin?: boolean;
  calendarSettings?: {
    syncEnabled: boolean;
    provider: 'google' | 'outlook' | 'apple';
    privacyLevel: 'free-busy' | 'full-details';
  };
}

export interface DirectMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
}

export interface DMThread {
  id: string;
  participantIds: string[]; // [userA, userB]
  messages: DirectMessage[];
  lastUpdated: number;
  unreadCount: number;
  isGroupChat?: boolean;
  name?: string; // For group chats
}

// --- Social Hub Types ---

export interface Group {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  isPrivate: boolean; // "Airlocked" logic
  imageUrl?: string;
  campaignId?: string; // Link to a D&D Campaign
  settings?: {
    emailUnreadDelay?: number; // hours, e.g. 6
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  location?: string;
  type: 'dnd' | 'hangout' | 'other';
  groupId?: string;
}

// --- Campaign Management Types ---

export interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  background: string;
  level: number;
  stats: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  bio?: string;
  imageUrl?: string;
  
  // User Linkage
  playerId?: string; // ID of the registered User playing this character
  inviteEmail?: string; // Legacy/External invite email if no user assigned
  inviteStatus?: 'none' | 'sent' | 'accepted';

  // --- Extended Character Sheet Data ---
  alignment?: string;
  xp?: number;
  
  // Combat Stats
  armorClass?: number;
  speed?: number;
  initiative?: number;
  hp?: { 
    current: number; 
    max: number; 
    temp: number; 
  };
  hitDice?: {
    total: number;
    current: number;
    size: string; // e.g. "d8"
  };
  deathSaves?: {
    successes: number; // 0-3
    failures: number; // 0-3
  };

  // Proficiencies & Skills
  proficiencyBonus?: number;
  skills?: string[]; // Array of strings like "Acrobatics +5", "Perception +3"
  proficiencies?: string; // Text block for languages, tools, armor
  
  // Actions & Inventory
  attacks?: Array<{
    name: string;
    bonus: string; // e.g. "+5"
    damage: string; // e.g. "1d8+3"
    type: string; // e.g. "Slashing"
  }>;
  equipment?: string; // Text block
  features?: string; // Text block for Class Features & Feats
  
  // Personality
  personality?: {
    traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
  };
}

export interface LogEntry {
  id: string;
  timestamp: number;
  content: string;
  type: 'note' | 'decision' | 'quest' | 'interaction';
}

export interface PlayerMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  isWhisper?: boolean;
  isRoll?: boolean;
  rollResult?: {
    total: number;
    formula: string;
  };
  attachmentUrl?: string; // For generated images/maps
}

export interface Campaign {
  id: string;
  name: string;
  inviteCode: string;
  description: string;
  characters: Character[];
  logs: LogEntry[];
  playerChat: PlayerMessage[];
  aiChatHistory: Message[];
  isAiDm?: boolean; // If true, the Admin is a player and AI is the DM
  bannerUrl?: string; // Customizable banner image for the campaign card
}

export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  introText: string;
  difficulty: string;
  coverImage?: string;
}