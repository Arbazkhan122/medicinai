import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: string;
          license_number?: string;
          phone?: string;
          is_active: boolean;
          last_login?: string;
          storage_preferences: string[];
          encryption_key_hash: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          role?: string;
          license_number?: string;
          phone?: string;
          is_active?: boolean;
          last_login?: string;
          storage_preferences: string[];
          encryption_key_hash: string;
          encrypted_data?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          role?: string;
          license_number?: string;
          phone?: string;
          is_active?: boolean;
          last_login?: string;
          storage_preferences?: string[];
          encryption_key_hash?: string;
          encrypted_data?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      encrypted_data: {
        Row: {
          id: string;
          user_id: string;
          data_type: string;
          encrypted_content: string;
          storage_location: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          data_type: string;
          encrypted_content: string;
          storage_location: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          data_type?: string;
          encrypted_content?: string;
          storage_location?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};