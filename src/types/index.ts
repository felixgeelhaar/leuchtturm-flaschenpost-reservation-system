// Core application types

export interface Address {
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  addressLine2?: string; // For apartment, suite, etc.
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: Address;
  createdAt: string;
  updatedAt: string;
  consentVersion: string;
  consentTimestamp: string;
  dataRetentionUntil?: string;
  lastActivity: string;
}

export interface Magazine {
  id: string;
  title: string;
  issueNumber: string;
  publishDate: string;
  description?: string;
  totalCopies: number;
  availableCopies: number;
  coverImageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  userId: string;
  magazineId: string;
  quantity: number;
  status: ReservationStatus;
  reservationDate: string;
  deliveryMethod: 'pickup' | 'shipping';
  pickupDate?: string;
  pickupLocation?: string;
  paymentMethod?: string;
  shippingAddress?: Address;
  notes?: string;
  consentReference: string;
  // Picture order fields
  orderGroupPicture?: boolean;
  childGroupName?: string;
  orderVorschulPicture?: boolean;
  childIsVorschueler?: boolean;
  childName?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'expired';

// Picture claim tracking
export interface PictureClaim {
  id: string;
  familyEmail: string; // Email used to identify family
  groupName: string; // Which kindergarten group
  pictureType: 'group' | 'vorschul';
  childName: string;
  claimedAt: string;
  reservationId: string; // Link to the reservation
}

export interface ReservationFormData {
  firstName: string;
  lastName: string;
  email: string;
  address?: Address;
  magazineId: string;
  quantity: number;
  pickupLocation: string;
  pickupDate?: string;
  deliveryMethod: 'pickup' | 'shipping';
  paymentMethod?: 'paypal' | '';
  notes?: string;
  consents: ConsentData;
  // Picture order fields
  orderGroupPicture?: boolean;
  childGroupName?: string; // Which group the child belongs to
  orderVorschulPicture?: boolean;
  childIsVorschueler?: boolean;
  childName?: string; // Child's name for verification
}

// GDPR Consent Types
export interface ConsentData {
  essential: boolean;        // Required for service
  functional: boolean;       // Enhanced functionality  
  analytics: boolean;        // Usage analytics
  marketing: boolean;        // Marketing communications
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: keyof ConsentData;
  consentGiven: boolean;
  consentVersion: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  withdrawalTimestamp?: string;
}

export interface DataProcessingLog {
  id: string;
  userId?: string;
  action: DataProcessingAction;
  dataType: DataType;
  timestamp: string;
  legalBasis: LegalBasis;
  processorId?: string;
  ipAddress?: string;
  details?: string;
}

export type DataProcessingAction = 
  | 'created' 
  | 'updated' 
  | 'accessed' 
  | 'exported' 
  | 'deleted'
  | 'consent_given'
  | 'consent_withdrawn'
  | 'reservation_created'
  | 'reservation_updated'
  | 'reservation_cancelled';

export type DataType = 
  | 'user_data' 
  | 'reservation' 
  | 'consent'
  | 'processing_log';

export type LegalBasis = 
  | 'consent' 
  | 'contract' 
  | 'legitimate_interest'
  | 'user_request';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ApiError {
  message: string;
  errors?: ValidationError[];
  statusCode: number;
}

// Form Validation Types
export interface FormErrors {
  [key: string]: string;
}

export interface FormState {
  isSubmitting: boolean;
  hasErrors: boolean;
  errors: FormErrors;
  isValid: boolean;
}

// Environment Variables
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  SITE_URL: string;
  
  // Supabase
  PUBLIC_SUPABASE_URL: string;
  PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // Security
  JWT_SECRET: string;
  SESSION_SECRET: string;
  ENCRYPTION_KEY: string;
  CSRF_SECRET: string;
  
  // Email
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
  
  // Monitoring
  SENTRY_DSN?: string;
  GA_MEASUREMENT_ID?: string;
  
  // Features
  ENABLE_ANALYTICS: boolean;
  ENABLE_MONITORING: boolean;
  DEBUG_MODE: boolean;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredOnly<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;

// Event Types for Analytics
export interface AnalyticsEvent {
  event: string;
  category: string;
  label?: string;
  value?: number;
  userId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Component Props Types
export interface ReservationFormProps {
  magazines: Magazine[];
  initialData?: Partial<ReservationFormData>;
  onSubmit?: (data: ReservationFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export interface ConsentBannerProps {
  onAccept: (consents: ConsentData) => void;
  onDecline: () => void;
  isVisible: boolean;
}

export interface ErrorMessageProps {
  error?: string;
  className?: string;
}

// Database Types (Supabase)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<User, 'id' | 'createdAt'>>;
      };
      magazines: {
        Row: Magazine;
        Insert: Omit<Magazine, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<Magazine, 'id' | 'createdAt'>>;
      };
      reservations: {
        Row: Reservation;
        Insert: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<Reservation, 'id' | 'createdAt'>>;
      };
      user_consents: {
        Row: ConsentRecord;
        Insert: Omit<ConsentRecord, 'id'>;
        Update: Partial<Omit<ConsentRecord, 'id'>>;
      };
      data_processing_logs: {
        Row: DataProcessingLog;
        Insert: Omit<DataProcessingLog, 'id'>;
        Update: Partial<Omit<DataProcessingLog, 'id'>>;
      };
    };
  };
}