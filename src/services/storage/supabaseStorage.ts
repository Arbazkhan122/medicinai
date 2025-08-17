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
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const encryptedContent = EncryptionService.encryptData(data, encryptionKey);
      
      // First, check if the encrypted_data table exists
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'encrypted_data')
        .eq('table_schema', 'public');

      if (tablesError || !tables || tables.length === 0) {
        // Table doesn't exist, create it
        const { error: createError } = await supabase.rpc('create_encrypted_data_table');
        if (createError) {
          console.warn('Could not create encrypted_data table:', createError);
          // Fallback to storing in user metadata or profiles table
          return await this.storeInProfilesTable(userId, data, dataType, encryptedContent);
        }
      }

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

      if (error) {
        console.warn('Failed to insert into encrypted_data, trying profiles table:', error);
        return await this.storeInProfilesTable(userId, data, dataType, encryptedContent);
      }
      
      return result.id;
    } catch (error) {
      console.error('Supabase storage error:', error);
      throw new Error(`Failed to store data in Supabase: ${error}`);
    }
  }

  private async storeInProfilesTable(
    userId: string,
    data: any,
    dataType: string,
    encryptedContent: string
  ): Promise<string> {
    // Fallback: store in profiles table as JSON
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('encrypted_data')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const existingData = profile?.encrypted_data || {};
    const dataId = crypto.randomUUID();
    existingData[dataId] = {
      data_type: dataType,
      encrypted_content: encryptedContent,
      created_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ encrypted_data: existingData })
      .eq('id', userId);

    if (updateError) throw updateError;
    return dataId;
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