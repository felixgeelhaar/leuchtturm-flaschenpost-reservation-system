import { describe, it, expect } from "vitest";
import type { ReservationFormData, ConsentData, Address } from "@/types";

describe("Type Validation and Guards", () => {
  describe("ConsentData Validation", () => {
    it("validates consent data structure", () => {
      const validConsent: ConsentData = {
        essential: true,
        functional: false,
        analytics: true,
        marketing: false,
      };

      const invalidConsent = {
        essential: "yes", // Should be boolean
        functional: false,
        analytics: true,
        // marketing missing
      };

      // Type guards
      const isValidConsentData = (data: any): data is ConsentData => {
        return (
          typeof data === "object" &&
          data !== null &&
          typeof data.essential === "boolean" &&
          typeof data.functional === "boolean" &&
          typeof data.analytics === "boolean" &&
          typeof data.marketing === "boolean"
        );
      };

      expect(isValidConsentData(validConsent)).toBe(true);
      expect(isValidConsentData(invalidConsent)).toBe(false);
      expect(isValidConsentData(null)).toBe(false);
      expect(isValidConsentData({})).toBe(false);
    });

    it("validates essential consent requirement", () => {
      const validateEssentialConsent = (consents: ConsentData): boolean => {
        return consents.essential === true;
      };

      expect(
        validateEssentialConsent({
          essential: true,
          functional: false,
          analytics: false,
          marketing: false,
        }),
      ).toBe(true);

      expect(
        validateEssentialConsent({
          essential: false,
          functional: true,
          analytics: true,
          marketing: true,
        }),
      ).toBe(false);
    });
  });

  describe("Address Validation", () => {
    it("validates address structure", () => {
      const validAddress: Address = {
        street: "Musterstraße",
        houseNumber: "123",
        postalCode: "10115",
        city: "Berlin",
        country: "DE",
        addressLine2: "Apartment 5",
      };

      const minimalAddress: Address = {
        street: "Test Street",
        houseNumber: "1",
        postalCode: "12345",
        city: "Test City",
        country: "DE",
      };

      const isValidAddress = (address: any): address is Address => {
        return (
          typeof address === "object" &&
          address !== null &&
          typeof address.street === "string" &&
          typeof address.houseNumber === "string" &&
          typeof address.postalCode === "string" &&
          typeof address.city === "string" &&
          typeof address.country === "string" &&
          (address.addressLine2 === undefined ||
            typeof address.addressLine2 === "string")
        );
      };

      expect(isValidAddress(validAddress)).toBe(true);
      expect(isValidAddress(minimalAddress)).toBe(true);
      expect(isValidAddress({})).toBe(false);
      expect(isValidAddress(null)).toBe(false);
    });

    it("validates required address fields for shipping", () => {
      const validateShippingAddress = (address?: Address): boolean => {
        if (!address) return false;

        return !!(
          address.street &&
          address.houseNumber &&
          address.postalCode &&
          address.city &&
          address.country
        );
      };

      const completeAddress: Address = {
        street: "Test Street",
        houseNumber: "123",
        postalCode: "10115",
        city: "Berlin",
        country: "DE",
      };

      const incompleteAddress: Address = {
        street: "Test Street",
        houseNumber: "123",
        postalCode: "10115",
        city: "", // Missing city
        country: "DE",
      };

      expect(validateShippingAddress(completeAddress)).toBe(true);
      expect(validateShippingAddress(incompleteAddress)).toBe(false);
      expect(validateShippingAddress(undefined)).toBe(false);
    });

    it("validates supported countries", () => {
      const SUPPORTED_COUNTRIES = ["DE", "AT", "CH"] as const;
      type SupportedCountry = (typeof SUPPORTED_COUNTRIES)[number];

      const isSupportedCountry = (
        country: string,
      ): country is SupportedCountry => {
        return SUPPORTED_COUNTRIES.includes(country as SupportedCountry);
      };

      expect(isSupportedCountry("DE")).toBe(true);
      expect(isSupportedCountry("AT")).toBe(true);
      expect(isSupportedCountry("CH")).toBe(true);
      expect(isSupportedCountry("US")).toBe(false);
      expect(isSupportedCountry("FR")).toBe(false);
      expect(isSupportedCountry("")).toBe(false);
    });
  });

  describe("ReservationFormData Validation", () => {
    it("validates complete form data structure", () => {
      const validPickupData: ReservationFormData = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        magazineId: "mag-123",
        quantity: 1,
        deliveryMethod: "pickup",
        pickupLocation: "Berlin Mitte",
        pickupDate: "2024-12-15",
        notes: "Test notes",
        consents: {
          essential: true,
          functional: false,
          analytics: false,
          marketing: false,
        },
      };

      const validShippingData: ReservationFormData = {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        magazineId: "mag-123",
        quantity: 2,
        deliveryMethod: "shipping",
        pickupLocation: "",
        address: {
          street: "Test Street",
          houseNumber: "456",
          postalCode: "10115",
          city: "Berlin",
          country: "DE",
        },
        consents: {
          essential: true,
          functional: true,
          analytics: false,
          marketing: true,
        },
      };

      const isValidReservationFormData = (
        data: any,
      ): data is ReservationFormData => {
        return (
          typeof data === "object" &&
          data !== null &&
          typeof data.firstName === "string" &&
          typeof data.lastName === "string" &&
          typeof data.email === "string" &&
          typeof data.magazineId === "string" &&
          typeof data.quantity === "number" &&
          (data.deliveryMethod === "pickup" ||
            data.deliveryMethod === "shipping") &&
          typeof data.consents === "object"
        );
      };

      expect(isValidReservationFormData(validPickupData)).toBe(true);
      expect(isValidReservationFormData(validShippingData)).toBe(true);
      expect(isValidReservationFormData({})).toBe(false);
      expect(isValidReservationFormData(null)).toBe(false);
    });

    it("validates delivery method constraints", () => {
      const validateDeliveryConstraints = (
        data: ReservationFormData,
      ): boolean => {
        if (data.deliveryMethod === "pickup") {
          return !!(
            data.pickupLocation && data.pickupLocation.trim().length > 0
          );
        }

        if (data.deliveryMethod === "shipping") {
          return !!(
            data.address &&
            data.address.street &&
            data.address.houseNumber &&
            data.address.postalCode &&
            data.address.city &&
            data.address.country
          );
        }

        return false;
      };

      const validPickup: ReservationFormData = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        magazineId: "mag-123",
        quantity: 1,
        deliveryMethod: "pickup",
        pickupLocation: "Berlin Mitte",
        pickupDate: "",
        consents: {
          essential: true,
          functional: false,
          analytics: false,
          marketing: false,
        },
      };

      const invalidPickup: ReservationFormData = {
        ...validPickup,
        pickupLocation: "", // Missing pickup location
      };

      const validShipping: ReservationFormData = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        magazineId: "mag-123",
        quantity: 1,
        deliveryMethod: "shipping",
        pickupLocation: "",
        address: {
          street: "Test Street",
          houseNumber: "123",
          postalCode: "10115",
          city: "Berlin",
          country: "DE",
        },
        consents: {
          essential: true,
          functional: false,
          analytics: false,
          marketing: false,
        },
      };

      const invalidShipping: ReservationFormData = {
        ...validShipping,
        address: {
          street: "Test Street",
          houseNumber: "123",
          postalCode: "10115",
          city: "", // Missing city
          country: "DE",
        },
      };

      expect(validateDeliveryConstraints(validPickup)).toBe(true);
      expect(validateDeliveryConstraints(invalidPickup)).toBe(false);
      expect(validateDeliveryConstraints(validShipping)).toBe(true);
      expect(validateDeliveryConstraints(invalidShipping)).toBe(false);
    });

    it("validates field length constraints", () => {
      const validateFieldLengths = (
        data: ReservationFormData,
      ): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (data.firstName.length < 2 || data.firstName.length > 100) {
          errors.push("firstName length invalid");
        }

        if (data.lastName.length < 2 || data.lastName.length > 100) {
          errors.push("lastName length invalid");
        }

        if (data.email.length > 254) {
          errors.push("email too long");
        }

        // Phone field removed from form

        if (data.notes && data.notes.length > 500) {
          errors.push("notes too long");
        }

        return { isValid: errors.length === 0, errors };
      };

      const validData: ReservationFormData = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        magazineId: "mag-123",
        quantity: 1,
        deliveryMethod: "pickup",
        pickupLocation: "Berlin",
        notes: "Short note",
        consents: {
          essential: true,
          functional: false,
          analytics: false,
          marketing: false,
        },
      };

      const invalidData: ReservationFormData = {
        firstName: "J", // Too short
        lastName: "D", // Too short
        email: "a".repeat(255) + "@example.com", // Too long
        magazineId: "mag-123",
        quantity: 1,
        deliveryMethod: "pickup",
        pickupLocation: "Berlin",
        notes: "a".repeat(501), // Too long
        consents: {
          essential: true,
          functional: false,
          analytics: false,
          marketing: false,
        },
      };

      const validResult = validateFieldLengths(validData);
      const invalidResult = validateFieldLengths(invalidData);

      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain("firstName length invalid");
      expect(invalidResult.errors).toContain("lastName length invalid");
      expect(invalidResult.errors).toContain("email too long");
      // Phone field removed from form
      expect(invalidResult.errors).toContain("notes too long");
    });
  });

  describe("Type Transformations", () => {
    it("transforms form data to database format", () => {
      const transformToDbFormat = (formData: ReservationFormData) => {
        return {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email.toLowerCase(),
          // phone: formData.phone || null, // Phone field removed
          magazine_id: formData.magazineId,
          quantity: formData.quantity,
          delivery_method: formData.deliveryMethod,
          pickup_location:
            formData.deliveryMethod === "pickup"
              ? formData.pickupLocation
              : null,
          pickup_date: formData.pickupDate || null,
          shipping_street:
            formData.deliveryMethod === "shipping"
              ? formData.address?.street
              : null,
          shipping_house_number:
            formData.deliveryMethod === "shipping"
              ? formData.address?.houseNumber
              : null,
          shipping_postal_code:
            formData.deliveryMethod === "shipping"
              ? formData.address?.postalCode
              : null,
          shipping_city:
            formData.deliveryMethod === "shipping"
              ? formData.address?.city
              : null,
          shipping_country:
            formData.deliveryMethod === "shipping"
              ? formData.address?.country
              : null,
          notes: formData.notes || null,
        };
      };

      const formData: ReservationFormData = {
        firstName: "John",
        lastName: "Doe",
        email: "JOHN@EXAMPLE.COM",
        magazineId: "mag-123",
        quantity: 2,
        deliveryMethod: "shipping",
        pickupLocation: "",
        address: {
          street: "Test Street",
          houseNumber: "123",
          postalCode: "10115",
          city: "Berlin",
          country: "DE",
        },
        notes: "Test notes",
        consents: {
          essential: true,
          functional: false,
          analytics: false,
          marketing: false,
        },
      };

      const dbFormat = transformToDbFormat(formData);

      expect(dbFormat.first_name).toBe("John");
      expect(dbFormat.last_name).toBe("Doe");
      expect(dbFormat.email).toBe("john@example.com"); // Lowercased
      expect(dbFormat.delivery_method).toBe("shipping");
      expect(dbFormat.pickup_location).toBeNull(); // Not pickup
      expect(dbFormat.shipping_street).toBe("Test Street");
      expect(dbFormat.shipping_city).toBe("Berlin");
    });

    it("transforms database format to API response", () => {
      const transformToApiResponse = (dbData: any) => {
        return {
          id: dbData.id,
          firstName: dbData.first_name,
          lastName: dbData.last_name,
          email: dbData.email,
          phone: dbData.phone,
          createdAt: dbData.created_at,
          updatedAt: dbData.updated_at,
        };
      };

      const dbData = {
        id: "user-123",
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        phone: "+49123456789",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const apiResponse = transformToApiResponse(dbData);

      expect(apiResponse.id).toBe("user-123");
      expect(apiResponse.firstName).toBe("John");
      expect(apiResponse.lastName).toBe("Doe");
      expect(apiResponse.createdAt).toBe("2024-01-01T00:00:00Z");
    });
  });
});
