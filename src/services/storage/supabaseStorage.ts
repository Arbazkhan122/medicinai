import { supabase } from '../../lib/supabase';
import { EncryptionService } from '../encryption';

export class SupabaseStorage {
  /**
   * Store encrypted data in Supabase
   */
  async storeEncryptedData(
    userId: string,
    data: any,
    dataType: string,
    encryptionKey: string
  ): Promise<string> {
    try {
      const encryptedContent = EncryptionService.encryptData(data, encryptionKey);
      
      const { data: result, error } = await supabase
        .from('encrypted_data')
        .insert({
          user_id: userId,
          data_type: dataType,
          encrypted_content: encryptedContent,
          storage_location: 'supabase'
        })
        .select()
        .single();

      if (error) throw error;
      return result.id;
    } catch (error) {
      throw new Error(`Failed to store data in Supabase: ${error}`);
    }
  }

  /**
   * Retrieve and decrypt data from Supabase
   */
  async retrieveEncryptedData<T>(
    userId: string,
    dataType: string,
    encryptionKey: string
  ): Promise<T[]> {
    try {
      const { data, error } = await supabase
        .from('encrypted_data')
        .select('*')
        .eq('user_id', userId)
        .eq('data_type', dataType)
        .eq('storage_location', 'supabase');

      if (error) throw error;

      const decryptedData = data.map(item => 
        EncryptionService.decryptData<T>(item.encrypted_content, encryptionKey)
      );

      return decryptedData;
    } catch (error) {
      throw new Error(`Failed to retrieve data from Supabase: ${error}`);
    }
  }

  /**
   * Update encrypted data in Supabase
   */
  async updateEncryptedData(
    id: string,
    data: any,
    encryptionKey: string
  ): Promise<void> {
    try {
      const encryptedContent = EncryptionService.encryptData(data, encryptionKey);
      
      const { error } = await supabase
        .from('encrypted_data')
        .update({
          encrypted_content: encryptedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      throw new Error(`Failed to update data in Supabase: ${error}`);
    }
  }

  /**
   * Delete encrypted data from Supabase
   */
  async deleteEncryptedData(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('encrypted_data')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      throw new Error(`Failed to delete data from Supabase: ${error}`);
    }
  }

  /**
   * List all encrypted data for a user
   */
  async listUserData(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('encrypted_data')
        .select('id, data_type, created_at, updated_at')
        .eq('user_id', userId)
        .eq('storage_location', 'supabase')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to list user data: ${error}`);
    }
  }
}