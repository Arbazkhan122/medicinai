import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key')) {
  throw new Error('Supabase configuration is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file with your actual Supabase project credentials.');
}

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