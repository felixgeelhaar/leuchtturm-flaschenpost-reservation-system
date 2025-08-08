// Database utility functions for reservation system
import { createServerSupabaseClient } from './supabase';
import type { 
  User, 
  Magazine, 
  Reservation, 
  ConsentRecord, 
  DataProcessingLog,
  ReservationFormData,
  ConsentData, 
} from '@/types';

// Server-side database operations
export class DatabaseService {
  private supabase = createServerSupabaseClient();

  // User operations
  async createUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    address?: {
      street?: string;
      houseNumber?: string;
      postalCode?: string;
      city?: string;
      country?: string;
      addressLine2?: string;
    };
    consentVersion: string;
  }): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .insert({
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        // phone column doesn't exist in users table
        // phone: userData.phone,
        street: userData.address?.street,
        house_number: userData.address?.houseNumber,
        address_line2: userData.address?.addressLine2,
        postal_code: userData.address?.postalCode,
        city: userData.address?.city,
        country: userData.address?.country,
        consent_version: userData.consentVersion,
        data_retention_until: this.calculateRetentionDate(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return this.mapUserFromDB(data);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return this.mapUserFromDB(data);
  }

  async updateUserActivity(userId: string): Promise<void> {
    // Skip updating last_activity as column doesn't exist
    // This method is kept for compatibility but does nothing
    return;
    
    /* Original code - commented out as last_activity column doesn't exist
    const { error } = await this.supabase
      .from('users')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update user activity:', error);
    }
    */
  }

  // Magazine operations
  async getActiveMagazines(): Promise<Magazine[]> {
    const { data, error } = await this.supabase
      .from('magazines')
      .select('*')
      .gt('available_copies', 0)
      .order('publish_date', { ascending: false });

    if (error) throw new Error(`Failed to get magazines: ${error.message}`);
    return data.map(this.mapMagazineFromDB);
  }

  async getMagazineById(id: string): Promise<Magazine | null> {
    const { data, error } = await this.supabase
      .from('magazines')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get magazine: ${error.message}`);
    }

    return this.mapMagazineFromDB(data);
  }

  // Reservation operations
  async createReservation(formData: ReservationFormData): Promise<Reservation> {
    // Get or create user
    let user = await this.getUserByEmail(formData.email);
    
    if (!user) {
      // Create user if they don't exist
      user = await this.createUser({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        // phone: formData.phone, // phone column doesn't exist
        address: formData.deliveryMethod === 'shipping' ? formData.address : undefined,
        consentVersion: '1.0',
      });
    }

    // consent_reference and expires_at columns don't exist
    // const consentReference = `consent-${user.id}-${Date.now()}`;
    // const expiresAt = new Date();
    // expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const { data, error } = await this.supabase
      .from('reservations')
      .insert({
        user_id: user.id,
        magazine_id: formData.magazineId,
        quantity: formData.quantity,
        delivery_method: formData.deliveryMethod,
        pickup_location: formData.deliveryMethod === 'pickup' ? formData.pickupLocation : null,
        pickup_date: formData.pickupDate || null,
        shipping_street: formData.deliveryMethod === 'shipping' ? formData.address?.street : null,
        shipping_house_number: formData.deliveryMethod === 'shipping' ? formData.address?.houseNumber : null,
        shipping_address_line2: formData.deliveryMethod === 'shipping' ? formData.address?.addressLine2 : null,
        shipping_postal_code: formData.deliveryMethod === 'shipping' ? formData.address?.postalCode : null,
        shipping_city: formData.deliveryMethod === 'shipping' ? formData.address?.city : null,
        shipping_country: formData.deliveryMethod === 'shipping' ? formData.address?.country : null,
        notes: formData.notes || null,
        // consent_reference column doesn't exist
        // consent_reference: consentReference,
        // Picture order fields - these columns might not exist
        // order_group_picture: formData.orderGroupPicture || false,
        // child_group_name: formData.childGroupName || null,
        // order_vorschul_picture: formData.orderVorschulPicture || false,
        // child_is_vorschueler: formData.childIsVorschueler || false,
        // child_name: formData.childName || null,
        // expires_at column doesn't exist
        // expires_at: expiresAt.toISOString(),
      })
      .select(`
        *,
        users (
          id,
          email,
          first_name,
          last_name
        ),
        magazines (
          id,
          title,
          issue_number,
          publish_date
        )
      `)
      .single();

    if (error) throw new Error(`Failed to create reservation: ${error.message}`);

    // Log the data processing action
    await this.logDataProcessing({
      userId: user.id,
      action: 'reservation_created',
      dataType: 'reservation',
      legalBasis: 'consent',
      details: JSON.stringify({ 
        reservationId: data.id,
        magazineId: formData.magazineId,
        quantity: formData.quantity, 
      }),
    });

    return this.mapReservationFromDB(data);
  }

  async getUserReservations(userId: string): Promise<Reservation[]> {
    const { data, error } = await this.supabase
      .from('reservations')
      .select(`
        *,
        magazines (
          id,
          title,
          issue_number,
          publish_date,
          cover_image_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get reservations: ${error.message}`);
    return data.map(this.mapReservationFromDB);
  }

  async cancelReservation(reservationId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId)
      .eq('user_id', userId);

    if (error) throw new Error(`Failed to cancel reservation: ${error.message}`);

    await this.logDataProcessing({
      userId,
      action: 'reservation_cancelled',
      dataType: 'reservation',
      legalBasis: 'user_request',
      details: JSON.stringify({ reservationId }),
    });
  }

  // GDPR Consent operations
  async recordConsent(
    userId: string, 
    consents: ConsentData, 
    metadata: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    const consentRecords = Object.entries(consents).map(([type, given]) => ({
      user_id: userId,
      consent_type: type as keyof ConsentData,
      consent_given: given,
      consent_version: '1.0',
      // Temporarily disable IP address to avoid inet format issues
      // ip_address: metadata.ipAddress || null,
      // user_agent column doesn't exist in the database
      // user_agent: metadata.userAgent || null,
    }));

    const { error } = await this.supabase
      .from('user_consents')
      .insert(consentRecords);

    if (error) throw new Error(`Failed to record consent: ${error.message}`);

    await this.logDataProcessing({
      userId,
      action: 'consent_given',
      dataType: 'consent',
      legalBasis: 'consent',
      ipAddress: metadata.ipAddress,
      details: JSON.stringify(consents),
    });
  }

  async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    const { data, error } = await this.supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) throw new Error(`Failed to get consents: ${error.message}`);
    return data.map(this.mapConsentFromDB);
  }

  async withdrawConsent(userId: string, consentType: keyof ConsentData): Promise<void> {
    const { error } = await this.supabase
      .from('user_consents')
      .update({ 
        consent_given: false,
        // withdrawal_timestamp column might not exist
        // withdrawal_timestamp: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('consent_type', consentType);
      // .is('withdrawal_timestamp', null);

    if (error) throw new Error(`Failed to withdraw consent: ${error.message}`);

    await this.logDataProcessing({
      userId,
      action: 'consent_withdrawn',
      dataType: 'consent',
      legalBasis: 'user_request',
      details: JSON.stringify({ consentType }),
    });
  }

  // GDPR Data operations
  async exportUserData(userId: string): Promise<any> {
    // Get user data
    const { data: userData } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // Get reservations
    const { data: reservations } = await this.supabase
      .from('reservations')
      .select(`
        *,
        magazines (title, issue_number)
      `)
      .eq('user_id', userId);

    // Get consents
    const { data: consents } = await this.supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', userId);

    const exportData = {
      exportDate: new Date().toISOString(),
      userData: userData ? this.mapUserFromDB(userData) : null,
      reservations: reservations?.map(this.mapReservationFromDB) || [],
      consents: consents?.map(this.mapConsentFromDB) || [],
    };

    // Log the data export
    await this.logDataProcessing({
      userId,
      action: 'exported',
      dataType: 'user_data',
      legalBasis: 'user_request',
      details: JSON.stringify({ exportSize: JSON.stringify(exportData).length }),
    });

    return exportData;
  }

  async deleteUserData(userId: string, reason: string = 'user_request'): Promise<void> {
    // Export data before deletion for compliance records
    const exportData = await this.exportUserData(userId);

    // Delete in correct order due to foreign key constraints
    await this.supabase.from('user_consents').delete().eq('user_id', userId);
    await this.supabase.from('reservations').delete().eq('user_id', userId);
    
    // Anonymize processing logs (keep for legal compliance)
    await this.supabase
      .from('data_processing_logs')
      .update({ 
        user_id: null,
        details: JSON.stringify({ anonymized: true, reason }),
      })
      .eq('user_id', userId);

    // Delete user record
    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw new Error(`Failed to delete user: ${error.message}`);

    // Final deletion log
    await this.logDataProcessing({
      action: 'deleted',
      dataType: 'user_data',
      legalBasis: 'user_request',
      details: JSON.stringify({ originalUserId: userId, reason }),
    });
  }

  // Data processing logging
  async logDataProcessing(log: {
    userId?: string;
    action: DataProcessingLog['action'];
    dataType: DataProcessingLog['dataType'];
    legalBasis: DataProcessingLog['legalBasis'];
    processorId?: string;
    ipAddress?: string;
    details?: string;
  }): Promise<void> {
    const { error } = await this.supabase
      .from('data_processing_logs')
      .insert({
        user_id: log.userId || null,
        action: log.action,
        data_type: log.dataType,
        legal_basis: log.legalBasis,
        processor_id: log.processorId || null,
        ip_address: log.ipAddress || null,
        details: log.details || null,
      });

    if (error) {
      console.error('Failed to log data processing:', error);
    }
  }

  // Utility functions
  private calculateRetentionDate(): string {
    const retentionDate = new Date();
    retentionDate.setFullYear(retentionDate.getFullYear() + 1); // 1 year retention
    return retentionDate.toISOString();
  }

  private mapUserFromDB(data: any): User {
    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: null, // phone column doesn't exist
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      consentVersion: data.consent_version,
      consentTimestamp: data.consent_timestamp,
      dataRetentionUntil: data.data_retention_until,
      lastActivity: null, // Column doesn't exist in database
    };
  }

  private mapMagazineFromDB(data: any): Magazine {
    return {
      id: data.id,
      title: data.title,
      issueNumber: data.issue_number,
      publishDate: data.publish_date,
      description: data.description,
      totalCopies: data.total_copies,
      availableCopies: data.available_copies,
      coverImageUrl: data.cover_image_url,
      isActive: true, // Default to true since column doesn't exist
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapReservationFromDB(data: any): Reservation {
    return {
      id: data.id,
      userId: data.user_id,
      magazineId: data.magazine_id,
      quantity: data.quantity,
      status: data.status,
      reservationDate: data.reservation_date,
      deliveryMethod: data.delivery_method || 'pickup',
      pickupDate: data.pickup_date,
      pickupLocation: data.pickup_location,
      paymentMethod: data.payment_method,
      shippingAddress: data.shipping_street ? {
        street: data.shipping_street,
        houseNumber: data.shipping_house_number,
        postalCode: data.shipping_postal_code,
        city: data.shipping_city,
        country: data.shipping_country,
        addressLine2: data.shipping_address_line2,
      } : undefined,
      notes: data.notes,
      consentReference: null, // Column doesn't exist
      // Picture order fields - columns don't exist in database
      orderGroupPicture: false, // data.order_group_picture,
      childGroupName: null, // data.child_group_name,
      orderVorschulPicture: false, // data.order_vorschul_picture,
      childIsVorschueler: false, // data.child_is_vorschueler,
      childName: null, // data.child_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      expiresAt: null, // Column doesn't exist
    };
  }

  private mapConsentFromDB(data: any): ConsentRecord {
    return {
      id: data.id,
      userId: data.user_id,
      consentType: data.consent_type,
      consentGiven: data.consent_given,
      consentVersion: data.consent_version,
      timestamp: data.timestamp,
      ipAddress: data.ip_address,
      userAgent: null, // Column doesn't exist in database
      withdrawalTimestamp: null, // Column doesn't exist in database
    };
  }

  // Cleanup operations for GDPR compliance
  async cleanupExpiredData(): Promise<{ 
    expiredReservations: number; 
    deletedUsers: number; 
    cleanedLogs: number 
  }> {
    const now = new Date().toISOString();
    
    // Clean expired reservations - expires_at column doesn't exist
    // Skip this for now since expires_at column doesn't exist
    const expiredReservations: any[] = [];
    /*
    const { data: expiredReservations } = await this.supabase
      .from('reservations')
      .update({ status: 'expired' })
      .lt('expires_at', now)
      .eq('status', 'pending')
      .select('id');
    */

    // Clean users past retention date
    const { data: expiredUsers } = await this.supabase
      .from('users')
      .select('id')
      .lt('data_retention_until', now);

    let deletedUsersCount = 0;
    if (expiredUsers) {
      for (const user of expiredUsers) {
        await this.deleteUserData(user.id, 'retention_period_expired');
        deletedUsersCount++;
      }
    }

    // Clean old audit logs (keep for 7 years minimum)
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 7);
    
    const { data: cleanedLogs } = await this.supabase
      .from('data_processing_logs')
      .delete()
      .lt('timestamp', cutoffDate.toISOString())
      .select('id');

    return {
      expiredReservations: expiredReservations?.length || 0,
      deletedUsers: deletedUsersCount,
      cleanedLogs: cleanedLogs?.length || 0,
    };
  }
}