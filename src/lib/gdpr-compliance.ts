// GDPR Compliance Utilities
import type { ConsentData, DataProcessingLog, User } from "@/types";

export class GDPRComplianceManager {
  private static readonly CONSENT_VERSION = "1.0";
  private static readonly RETENTION_PERIOD_DAYS = 365; // 1 year

  // Consent Management
  static async recordConsent(
    userId: string,
    consents: ConsentData,
    metadata: {
      ipAddress?: string;
      userAgent?: string;
      timestamp?: string;
    } = {},
  ): Promise<void> {
    const consentData = {
      userId,
      consents,
      version: this.CONSENT_VERSION,
      timestamp: metadata.timestamp || new Date().toISOString(),
      ipAddress: metadata.ipAddress || this.getClientIP(),
      userAgent: metadata.userAgent || navigator.userAgent,
    };

    // Store consent in database
    try {
      const response = await fetch("/api/gdpr/consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(consentData),
      });

      if (!response.ok) {
        throw new Error("Failed to record consent");
      }

      // Store locally for quick access
      this.storeLocalConsent(consents);
    } catch (error) {
      console.error("Failed to record consent:", error);
      throw error;
    }
  }

  static async withdrawConsent(
    userId: string,
    consentType: keyof ConsentData,
  ): Promise<void> {
    try {
      const response = await fetch("/api/gdpr/consent/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          consentType,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to withdraw consent");
      }

      // Update local storage
      const localConsent = this.getLocalConsent();
      if (localConsent) {
        localConsent[consentType] = false;
        this.storeLocalConsent(localConsent);
      }
    } catch (error) {
      console.error("Failed to withdraw consent:", error);
      throw error;
    }
  }

  static getLocalConsent(): ConsentData | null {
    try {
      const stored = localStorage.getItem("gdpr-consent");
      if (!stored) return null;

      const parsed = JSON.parse(stored);

      // Check if consent is still valid (not older than retention period)
      const consentDate = new Date(parsed.timestamp);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() - this.RETENTION_PERIOD_DAYS);

      if (consentDate < expiryDate) {
        this.clearLocalConsent();
        return null;
      }

      return parsed.consents;
    } catch (error) {
      console.error("Failed to get local consent:", error);
      return null;
    }
  }

  static storeLocalConsent(consents: ConsentData): void {
    try {
      const consentData = {
        consents,
        version: this.CONSENT_VERSION,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem("gdpr-consent", JSON.stringify(consentData));
    } catch (error) {
      console.error("Failed to store local consent:", error);
    }
  }

  static clearLocalConsent(): void {
    try {
      localStorage.removeItem("gdpr-consent");
    } catch (error) {
      console.error("Failed to clear local consent:", error);
    }
  }

  // Data Subject Rights
  static async requestDataExport(userId: string): Promise<Blob> {
    try {
      const response = await fetch("/api/gdpr/export-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          requestTimestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      return await response.blob();
    } catch (error) {
      console.error("Failed to export user data:", error);
      throw error;
    }
  }

  static async requestDataDeletion(
    userId: string,
    reason: string = "user_request",
  ): Promise<void> {
    try {
      const response = await fetch("/api/gdpr/delete-data", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          reason,
          requestTimestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete data");
      }

      // Clear local data
      this.clearLocalConsent();
      this.clearLocalUserData();
    } catch (error) {
      console.error("Failed to delete user data:", error);
      throw error;
    }
  }

  static async requestDataRectification(
    userId: string,
    updates: Partial<User>,
  ): Promise<void> {
    try {
      const response = await fetch("/api/gdpr/rectify-data", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          updates,
          requestTimestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to rectify data");
      }
    } catch (error) {
      console.error("Failed to rectify user data:", error);
      throw error;
    }
  }

  // Data Processing Logging
  static async logDataProcessing(logEntry: {
    userId?: string;
    action: DataProcessingLog["action"];
    dataType: DataProcessingLog["dataType"];
    legalBasis: DataProcessingLog["legalBasis"];
    details?: any;
  }): Promise<void> {
    try {
      const response = await fetch("/api/gdpr/log-processing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...logEntry,
          timestamp: new Date().toISOString(),
          ipAddress: this.getClientIP(),
          userAgent: navigator.userAgent,
          details: logEntry.details ? JSON.stringify(logEntry.details) : null,
        }),
      });

      if (!response.ok) {
        console.error("Failed to log data processing");
      }
    } catch (error) {
      console.error("Failed to log data processing:", error);
    }
  }

  // Cookie Management
  static setCookie(
    name: string,
    value: string,
    options: {
      expires?: Date;
      maxAge?: number;
      path?: string;
      domain?: string;
      secure?: boolean;
      sameSite?: "strict" | "lax" | "none";
      httpOnly?: boolean;
    } = {},
  ): void {
    const consent = this.getLocalConsent();

    // Check if we have consent for this type of cookie
    const cookieType = this.getCookieType(name);
    if (!this.hasConsentForCookieType(consent, cookieType)) {
      console.warn(`No consent for ${cookieType} cookie: ${name}`);
      return;
    }

    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (options.expires) {
      cookieString += `; expires=${options.expires.toUTCString()}`;
    }

    if (options.maxAge) {
      cookieString += `; max-age=${options.maxAge}`;
    }

    cookieString += `; path=${options.path || "/"}`;

    if (options.domain) {
      cookieString += `; domain=${options.domain}`;
    }

    if (options.secure || window.location.protocol === "https:") {
      cookieString += "; secure";
    }

    cookieString += `; samesite=${options.sameSite || "lax"}`;

    if (options.httpOnly) {
      cookieString += "; httponly";
    }

    document.cookie = cookieString;
  }

  static getCookie(name: string): string | null {
    const consent = this.getLocalConsent();
    const cookieType = this.getCookieType(name);

    if (!this.hasConsentForCookieType(consent, cookieType)) {
      return null;
    }

    const cookies = document.cookie.split(";");

    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split("=");
      if (decodeURIComponent(cookieName) === name) {
        return decodeURIComponent(cookieValue);
      }
    }

    return null;
  }

  static deleteCookie(name: string, path: string = "/", domain?: string): void {
    let cookieString = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;

    if (domain) {
      cookieString += `; domain=${domain}`;
    }

    document.cookie = cookieString;
  }

  // Data Minimization Helpers
  static sanitizeUserData(userData: any): any {
    const sanitized = { ...userData };

    // Remove sensitive fields that shouldn't be logged
    delete sanitized.password;
    delete sanitized.paymentInfo;
    delete sanitized.socialSecurityNumber;

    // Truncate long text fields
    if (sanitized.notes && sanitized.notes.length > 500) {
      sanitized.notes = sanitized.notes.substring(0, 500) + "...";
    }

    return sanitized;
  }

  static anonymizeUserData(userData: any): any {
    const anonymized = { ...userData };

    // Replace identifying information with anonymous placeholders
    if (anonymized.email) {
      anonymized.email = "anonymized@example.com";
    }

    if (anonymized.firstName) {
      anonymized.firstName = "Anonymous";
    }

    if (anonymized.lastName) {
      anonymized.lastName = "User";
    }

    if (anonymized.phone) {
      anonymized.phone = "+49 XXX XXXXXXX";
    }

    // Keep non-identifying fields for analytics
    const keepFields = ["id", "createdAt", "updatedAt", "country", "ageGroup"];
    const filtered: any = {};

    keepFields.forEach((field) => {
      if (field in anonymized) {
        filtered[field] = anonymized[field];
      }
    });

    return filtered;
  }

  // Utility Methods
  private static getCookieType(cookieName: string): keyof ConsentData {
    // Map cookie names to consent types
    const cookieTypeMap: Record<string, keyof ConsentData> = {
      session: "essential",
      csrf: "essential",
      auth: "essential",
      preferences: "functional",
      language: "functional",
      theme: "functional",
      analytics: "analytics",
      ga: "analytics",
      gtag: "analytics",
      marketing: "marketing",
      ads: "marketing",
      facebook: "marketing",
    };

    // Check if cookie name contains any of the mapped types
    for (const [key, type] of Object.entries(cookieTypeMap)) {
      if (cookieName.toLowerCase().includes(key)) {
        return type;
      }
    }

    // Default to functional for unknown cookies
    return "functional";
  }

  private static hasConsentForCookieType(
    consent: ConsentData | null,
    cookieType: keyof ConsentData,
  ): boolean {
    if (!consent) {
      // Only allow essential cookies without explicit consent
      return cookieType === "essential";
    }

    return consent[cookieType] === true;
  }

  private static getClientIP(): string {
    // This would typically be set by the server and passed to the client
    // For client-side, we can't reliably get the real IP
    return "client-side-unknown";
  }

  private static clearLocalUserData(): void {
    try {
      // Clear all user-related data from localStorage
      const keysToRemove = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.includes("user") ||
            key.includes("reservation") ||
            key.includes("session"))
        ) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.error("Failed to clear local user data:", error);
    }
  }

  // Compliance Validation
  static validateDataProcessing(
    action: string,
    dataType: string,
    legalBasis: string,
  ): boolean {
    const validActions = [
      "created",
      "updated",
      "accessed",
      "exported",
      "deleted",
      "consent_given",
      "consent_withdrawn",
      "reservation_created",
      "reservation_updated",
      "reservation_cancelled",
    ];

    const validDataTypes = [
      "user_data",
      "reservation",
      "consent",
      "processing_log",
    ];

    const validLegalBases = [
      "consent",
      "contract",
      "legitimate_interest",
      "user_request",
    ];

    return (
      validActions.includes(action) &&
      validDataTypes.includes(dataType) &&
      validLegalBases.includes(legalBasis)
    );
  }

  static generateDataRetentionDate(creationDate: Date = new Date()): Date {
    const retentionDate = new Date(creationDate);
    retentionDate.setDate(retentionDate.getDate() + this.RETENTION_PERIOD_DAYS);
    return retentionDate;
  }

  static isRetentionPeriodExpired(retentionDate: string | Date): boolean {
    const expiry = new Date(retentionDate);
    return expiry < new Date();
  }

  // Breach Notification (for internal use)
  static async reportDataBreach(breachDetails: {
    description: string;
    affectedUsers: number;
    dataTypes: string[];
    severity: "low" | "medium" | "high" | "critical";
    containmentMeasures: string;
  }): Promise<void> {
    try {
      const response = await fetch("/api/gdpr/report-breach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...breachDetails,
          timestamp: new Date().toISOString(),
          reportedBy: "system",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to report data breach");
      }
    } catch (error) {
      console.error("Failed to report data breach:", error);
      throw error;
    }
  }
}
