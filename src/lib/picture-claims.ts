/**
 * Picture Claims Service
 * 
 * Handles validation and tracking of free picture orders
 * Ensures each family can only claim one group picture and one Vorschüler picture
 */

import { supabase } from './supabase';
import type { PictureClaim } from '@/types';

export class PictureClaimsService {
  /**
   * Check if a family has already claimed a picture
   */
  async hasExistingClaim(
    email: string,
    groupName: string,
    pictureType: 'group' | 'vorschul'
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('picture_claims')
        .select('id')
        .eq('family_email', email.toLowerCase())
        .eq('group_name', groupName)
        .eq('picture_type', pictureType)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking picture claim:', error);
      throw new Error('Fehler beim Überprüfen der Bildbestellung');
    }
  }

  /**
   * Check multiple claims at once
   */
  async checkMultipleClaims(
    email: string,
    claims: Array<{ groupName: string; pictureType: 'group' | 'vorschul' }>
  ): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    try {
      for (const claim of claims) {
        const key = `${claim.groupName}-${claim.pictureType}`;
        const hasClaim = await this.hasExistingClaim(email, claim.groupName, claim.pictureType);
        results.set(key, hasClaim);
      }

      return results;
    } catch (error) {
      console.error('Error checking multiple claims:', error);
      throw new Error('Fehler beim Überprüfen der Bildbestellungen');
    }
  }

  /**
   * Create a new picture claim
   */
  async createClaim(
    email: string,
    groupName: string,
    pictureType: 'group' | 'vorschul',
    childName: string,
    reservationId: string
  ): Promise<PictureClaim> {
    try {
      // First check if claim already exists
      const exists = await this.hasExistingClaim(email, groupName, pictureType);
      
      if (exists) {
        throw new Error(
          `Sie haben bereits ein ${pictureType === 'group' ? 'Gruppenbild' : 'Vorschüler-Bild'} ` +
          `für die Gruppe ${groupName} bestellt.`
        );
      }

      const { data, error } = await supabase
        .from('picture_claims')
        .insert({
          family_email: email.toLowerCase(),
          group_name: groupName,
          picture_type: pictureType,
          child_name: childName,
          reservation_id: reservationId,
          claimed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error(
            `Sie haben bereits ein ${pictureType === 'group' ? 'Gruppenbild' : 'Vorschüler-Bild'} ` +
            `für die Gruppe ${groupName} bestellt.`
          );
        }
        throw error;
      }

      return data as PictureClaim;
    } catch (error) {
      console.error('Error creating picture claim:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Fehler beim Erstellen der Bildbestellung');
    }
  }

  /**
   * Get all claims for a family
   */
  async getFamilyClaims(email: string): Promise<PictureClaim[]> {
    try {
      const { data, error } = await supabase
        .from('picture_claims')
        .select('*')
        .eq('family_email', email.toLowerCase())
        .order('claimed_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as PictureClaim[];
    } catch (error) {
      console.error('Error fetching family claims:', error);
      throw new Error('Fehler beim Abrufen der Bildbestellungen');
    }
  }

  /**
   * Delete a claim (for cancellations)
   */
  async deleteClaim(reservationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('picture_claims')
        .delete()
        .eq('reservation_id', reservationId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting picture claim:', error);
      throw new Error('Fehler beim Löschen der Bildbestellung');
    }
  }

  /**
   * Validate picture order before submission
   */
  async validatePictureOrder(
    email: string,
    orderGroupPicture: boolean,
    groupName: string | undefined,
    orderVorschulPicture: boolean,
    childIsVorschueler: boolean
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check group picture claim
      if (orderGroupPicture && groupName) {
        const hasGroupClaim = await this.hasExistingClaim(email, groupName, 'group');
        if (hasGroupClaim) {
          errors.push(
            `Sie haben bereits ein Gruppenbild für die Gruppe "${groupName}" bestellt. ` +
            `Pro Familie ist nur ein Gruppenbild pro Gruppe erlaubt.`
          );
        }
      }

      // Check Vorschüler picture claim
      if (orderVorschulPicture && groupName) {
        if (!childIsVorschueler) {
          errors.push(
            'Um ein Vorschüler-Bild zu bestellen, muss Ihr Kind als Vorschüler markiert sein.'
          );
        } else {
          const hasVorschulClaim = await this.hasExistingClaim(email, groupName, 'vorschul');
          if (hasVorschulClaim) {
            errors.push(
              `Sie haben bereits ein Vorschüler-Bild für die Gruppe "${groupName}" bestellt. ` +
              `Pro Familie ist nur ein Vorschüler-Bild pro Gruppe erlaubt.`
            );
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('Error validating picture order:', error);
      return {
        valid: false,
        errors: ['Fehler bei der Validierung der Bildbestellung. Bitte versuchen Sie es später erneut.']
      };
    }
  }
}

// Export singleton instance
export const pictureClaimsService = new PictureClaimsService();