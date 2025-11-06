export enum ConnectionState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
}

export interface ConversationTurn {
  speaker: 'user' | 'model';
  text: string;
}

// Tipe Data untuk Riwayat Percakapan
export interface TranscriptItem {
  id?: number; // Opsional dari DB
  role: 'user' | 'model'; // Peran: Pengguna atau Model (AI)
  text: string; // Teks percakapan
  created_at?: string; // Opsional dari DB
}