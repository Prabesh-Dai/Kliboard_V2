export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      spaces: {
        Row: {
          id: string;
          name: string;
          content: string;
          password_hash: string | null;
          is_private: boolean;
          is_locked: boolean;
          duration: number;
          expires_at: string;
          owner_id: string | null;
          claim_token_hash: string | null;
          created_at: string;
          updated_at: string;
          encryption_version: number | null;
          kdf_salt: string | null;
          kdf_iterations: number | null;
          wrapped_dek: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          content?: string;
          password_hash?: string | null;
          is_private?: boolean;
          is_locked?: boolean;
          duration: number;
          expires_at: string;
          owner_id?: string | null;
          claim_token_hash?: string | null;
          created_at?: string;
          updated_at?: string;
          encryption_version?: number | null;
          kdf_salt?: string | null;
          kdf_iterations?: number | null;
          wrapped_dek?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          content?: string;
          password_hash?: string | null;
          is_private?: boolean;
          is_locked?: boolean;
          duration?: number;
          expires_at?: string;
          owner_id?: string | null;
          claim_token_hash?: string | null;
          created_at?: string;
          updated_at?: string;
          encryption_version?: number | null;
          kdf_salt?: string | null;
          kdf_iterations?: number | null;
          wrapped_dek?: string | null;
        };
        Relationships: [];
      };
      files: {
        Row: {
          id: string;
          space_id: string;
          filename: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          created_at: string;
          encryption_version: number | null;
        };
        Insert: {
          id?: string;
          space_id: string;
          filename: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          created_at?: string;
          encryption_version?: number | null;
        };
        Update: {
          id?: string;
          space_id?: string;
          filename?: string;
          storage_path?: string;
          mime_type?: string;
          size_bytes?: number;
          created_at?: string;
          encryption_version?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "files_space_id_fkey";
            columns: ["space_id"];
            isOneToOne: false;
            referencedRelation: "spaces";
            referencedColumns: ["id"];
          }
        ];
      };
      superadmins: {
        Row: {
          id: string;
          user_id: string;
          granted_via: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          granted_via?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          granted_via?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "superadmins_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
