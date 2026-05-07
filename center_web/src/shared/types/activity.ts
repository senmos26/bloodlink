/**
 * BloodLink Activity System Types
 */

// ============================================================================
// Activity Types
// ============================================================================

export type ActivityType =
  // Centers
  | 'center_created'
  | 'center_updated'
  // Donors
  | 'donor_created'
  | 'donor_updated'
  | 'donor_archived'
  // Donations
  | 'donation_created'
  | 'donation_updated'
  | 'donation_validated'
  // Appointments
  | 'appointment_created'
  | 'appointment_updated'
  | 'appointment_cancelled'
  // Alerts
  | 'alert_created'
  | 'alert_published';

// ============================================================================
// Activity Status/Tag
// ============================================================================

export type ActivityTag = 
  | 'created'    
  | 'updated'    
  | 'validated'
  | 'cancelled'
  | 'published'
  | 'archived';  

// ============================================================================
// Icon Mapping
// ============================================================================

export type ActivityIcon =
  | 'Building2'      // Centers
  | 'Users'          // Donors
  | 'Droplet'        // Donations
  | 'Calendar'       // Appointments
  | 'Bell';          // Alerts

// ============================================================================
// Activity Metadata
// ============================================================================

export interface ActivityMetadata {
  entityId: string;       
  entityType: 'center' | 'donor' | 'donation' | 'appointment' | 'alert';
  centerId?: string;     
  donorId?: string;
  donationId?: string;
  [key: string]: unknown;  
}

// ============================================================================
// Main Activity Interface
// ============================================================================

export interface Activity {
  id: string;              
  userId: string;          
  type: ActivityType;      
  icon: ActivityIcon;      
  entityName: string;      
  description: string;     
  timestamp: string;       
  tag: ActivityTag;        
  metadata: ActivityMetadata; 
}

// ============================================================================
// Activity Input (for creation)
// ============================================================================

export interface ActivityInput {
  type: ActivityType;
  icon: ActivityIcon;
  entityName: string;
  description: string;
  tag: ActivityTag;
  metadata: ActivityMetadata;
}
