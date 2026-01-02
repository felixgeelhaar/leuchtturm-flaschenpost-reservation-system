import { describe, it, expect } from "vitest";

describe("Utility Functions", () => {
  describe("Date Utilities", () => {
    it("calculates future dates correctly", () => {
      const today = new Date("2024-01-01T00:00:00Z");
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 7);

      expect(futureDate.getTime()).toBeGreaterThan(today.getTime());
      expect(futureDate.toISOString()).toBe("2024-01-08T00:00:00.000Z");
    });

    it("validates date formats", () => {
      const validDates = [
        "2024-01-01",
        "2024-12-31",
        "2024-02-29", // leap year
      ];

      const invalidDates = [
        "2024-13-01", // invalid month
        "invalid-date",
        "",
      ];

      validDates.forEach((dateStr) => {
        const date = new Date(dateStr);
        expect(date.toString()).not.toBe("Invalid Date");
      });

      invalidDates.forEach((dateStr) => {
        if (dateStr === "") {
          expect(dateStr).toBe("");
        } else {
          const date = new Date(dateStr);
          expect(date.toString()).toBe("Invalid Date");
        }
      });
    });

    it("calculates retention dates", () => {
      const calculateRetentionDate = (years: number = 1): string => {
        const retentionDate = new Date();
        retentionDate.setFullYear(retentionDate.getFullYear() + years);
        return retentionDate.toISOString();
      };

      const retentionDate = calculateRetentionDate(1);
      const currentYear = new Date().getFullYear();
      const retentionYear = new Date(retentionDate).getFullYear();

      expect(retentionYear).toBe(currentYear + 1);
    });
  });

  describe("String Utilities", () => {
    it("validates and sanitizes input strings", () => {
      const sanitizeInput = (input: string): string => {
        return input.trim().replace(/[<>]/g, "");
      };

      expect(sanitizeInput("  normal text  ")).toBe("normal text");
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe(
        'scriptalert("xss")/script',
      );
      expect(sanitizeInput("normal > text < here")).toBe("normal  text  here");
    });

    it("validates string lengths", () => {
      const validateLength = (
        str: string,
        min: number,
        max: number,
      ): boolean => {
        return str.length >= min && str.length <= max;
      };

      expect(validateLength("test", 2, 10)).toBe(true);
      expect(validateLength("a", 2, 10)).toBe(false);
      expect(validateLength("a".repeat(11), 2, 10)).toBe(false);
      expect(validateLength("ab", 2, 10)).toBe(true);
      expect(validateLength("a".repeat(10), 2, 10)).toBe(true);
    });

    it("generates reference IDs", async () => {
      const generateReference = (prefix: string, id: string): string => {
        return `${prefix}-${id}-${Date.now()}`;
      };

      const ref1 = generateReference("consent", "user-123");
      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));
      const ref2 = generateReference("consent", "user-123");

      expect(ref1).toContain("consent-user-123-");
      expect(ref2).toContain("consent-user-123-");
      expect(ref1).not.toBe(ref2); // Should be unique due to timestamp
    });
  });

  describe("Validation Utilities", () => {
    it("validates UUID format", () => {
      const isValidUUID = (uuid: string): boolean => {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
      };

      const validUUIDs = [
        "123e4567-e89b-12d3-a456-426614174000",
        "550e8400-e29b-41d4-a716-446655440000",
      ];

      const invalidUUIDs = [
        "not-a-uuid",
        "123e4567-e89b-12d3-a456",
        "123e4567-e89b-12d3-a456-42661417400g",
        "",
      ];

      validUUIDs.forEach((uuid) => {
        expect(isValidUUID(uuid)).toBe(true);
      });

      invalidUUIDs.forEach((uuid) => {
        expect(isValidUUID(uuid)).toBe(false);
      });
    });

    it("validates postal codes", () => {
      const validatePostalCode = (code: string, country: string): boolean => {
        const patterns = {
          DE: /^\d{5}$/,
          AT: /^\d{4}$/,
          CH: /^\d{4}$/,
        };

        const pattern = patterns[country as keyof typeof patterns];
        return pattern ? pattern.test(code) : false;
      };

      expect(validatePostalCode("10115", "DE")).toBe(true);
      expect(validatePostalCode("1010", "AT")).toBe(true);
      expect(validatePostalCode("8001", "CH")).toBe(true);

      expect(validatePostalCode("1011", "DE")).toBe(false); // Too short for DE
      expect(validatePostalCode("10115", "AT")).toBe(false); // Too long for AT
      expect(validatePostalCode("abcd", "DE")).toBe(false); // Invalid characters
    });

    it("validates quantity constraints", () => {
      const validateQuantity = (
        quantity: number,
        maxAvailable: number,
      ): boolean => {
        return quantity >= 1 && quantity <= 5 && quantity <= maxAvailable;
      };

      expect(validateQuantity(1, 10)).toBe(true);
      expect(validateQuantity(5, 10)).toBe(true);
      expect(validateQuantity(3, 2)).toBe(false); // More than available
      expect(validateQuantity(0, 10)).toBe(false); // Below minimum
      expect(validateQuantity(6, 10)).toBe(false); // Above maximum
    });
  });

  describe("Array and Object Utilities", () => {
    it("safely accesses nested properties", () => {
      const safeGet = (obj: any, path: string, defaultValue: any = null) => {
        try {
          return (
            path.split(".").reduce((current, key) => current?.[key], obj) ??
            defaultValue
          );
        } catch {
          return defaultValue;
        }
      };

      const testObj = {
        user: {
          profile: {
            name: "John Doe",
            address: {
              city: "Berlin",
            },
          },
        },
      };

      expect(safeGet(testObj, "user.profile.name")).toBe("John Doe");
      expect(safeGet(testObj, "user.profile.address.city")).toBe("Berlin");
      expect(safeGet(testObj, "user.profile.missing", "default")).toBe(
        "default",
      );
      expect(safeGet(null, "user.profile.name", "default")).toBe("default");
    });

    it("filters and maps arrays correctly", () => {
      const magazines = [
        { id: "1", title: "Magazine A", isActive: true, availableCopies: 5 },
        { id: "2", title: "Magazine B", isActive: false, availableCopies: 0 },
        { id: "3", title: "Magazine C", isActive: true, availableCopies: 10 },
      ];

      const activeMagazines = magazines.filter(
        (m) => m.isActive && m.availableCopies > 0,
      );
      const magazineTitles = magazines.map((m) => m.title);

      expect(activeMagazines).toHaveLength(2);
      expect(activeMagazines[0].title).toBe("Magazine A");
      expect(activeMagazines[1].title).toBe("Magazine C");

      expect(magazineTitles).toEqual([
        "Magazine A",
        "Magazine B",
        "Magazine C",
      ]);
    });

    it("groups objects by property", () => {
      const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
        return array.reduce(
          (groups, item) => {
            const group = String(item[key]);
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
          },
          {} as Record<string, T[]>,
        );
      };

      const reservations = [
        { id: "1", status: "pending", userId: "user1" },
        { id: "2", status: "confirmed", userId: "user1" },
        { id: "3", status: "pending", userId: "user2" },
      ];

      const groupedByStatus = groupBy(reservations, "status");
      const groupedByUser = groupBy(reservations, "userId");

      expect(Object.keys(groupedByStatus)).toEqual(["pending", "confirmed"]);
      expect(groupedByStatus.pending).toHaveLength(2);
      expect(groupedByStatus.confirmed).toHaveLength(1);

      expect(Object.keys(groupedByUser)).toEqual(["user1", "user2"]);
      expect(groupedByUser.user1).toHaveLength(2);
      expect(groupedByUser.user2).toHaveLength(1);
    });
  });

  describe("Error Handling Utilities", () => {
    it("creates standardized error responses", () => {
      const createErrorResponse = (
        error: string,
        message: string,
        statusCode: number = 400,
      ) => {
        return {
          success: false,
          error,
          message,
          statusCode,
          timestamp: new Date().toISOString(),
        };
      };

      const validationError = createErrorResponse(
        "Validation failed",
        "Invalid input data",
        400,
      );
      const serverError = createErrorResponse(
        "Internal server error",
        "Something went wrong",
        500,
      );

      expect(validationError.success).toBe(false);
      expect(validationError.statusCode).toBe(400);
      expect(validationError.timestamp).toBeDefined();

      expect(serverError.success).toBe(false);
      expect(serverError.statusCode).toBe(500);
      expect(serverError.error).toBe("Internal server error");
    });

    it("handles async errors gracefully", async () => {
      const asyncOperation = async (shouldFail: boolean) => {
        if (shouldFail) {
          throw new Error("Async operation failed");
        }
        return { success: true, data: "Operation completed" };
      };

      const safeAsyncOperation = async (shouldFail: boolean) => {
        try {
          return await asyncOperation(shouldFail);
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      };

      const successResult = await safeAsyncOperation(false);
      const errorResult = await safeAsyncOperation(true);

      expect(successResult.success).toBe(true);
      if (successResult.success) {
        expect((successResult as { success: true; data: string }).data).toBe(
          "Operation completed",
        );
      }

      expect(errorResult.success).toBe(false);
      if (!errorResult.success) {
        expect((errorResult as { success: false; error: string }).error).toBe(
          "Async operation failed",
        );
      }
    });
  });
});
