// src/types/models.ts

export type LetterStatus = "DRAFT" | "READY" | "SENT" | "ARCHIVED";

export interface Letter {
  id?: number;            // autoincrement interno
  local_id: string;       // UUID/local string, clave para relaciones
  child_code: string;
  status?: LetterStatus;
  text_feelings?: string | null;
  created_at: string;     // ISO string
  updated_at?: string | null;
}

export interface Drawing {
  id?: number;
  letter_id: string;      // letters.local_id
  svg_xml?: string | null;
  created_at?: string | null;
}

export interface Photo {
  id?: number;
  letter_id: string;      // letters.local_id
  photo_uri: string;      // <- la columna oficial
  created_at?: string | null;
}

export interface Message {
  id?: number;
  letter_id: string;      // letters.local_id
  text: string;
  created_at?: string | null;
}
