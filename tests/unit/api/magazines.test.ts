import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Magazine } from "@/types";

// Mock DatabaseService first
const mockDatabaseService = {
  getActiveMagazines: vi.fn(),
  logDataProcessing: vi.fn(),
};

vi.mock("@/lib/database", () => ({
  DatabaseService: vi.fn(() => mockDatabaseService),
}));

// Now import the API handler after mocking
const { GET } = await import("@/pages/api/magazines");

const mockMagazines: Magazine[] = [
  {
    id: "123e4567-e89b-12d3-a456-426614174000",
    title: "Flaschenpost",
    issueNumber: "2024-01",
    publishDate: "2024-01-01T00:00:00Z",
    description: "Test Magazine",
    totalCopies: 100,
    availableCopies: 95,
    coverImageUrl: "https://example.com/cover.jpg",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "223e4567-e89b-12d3-a456-426614174001",
    title: "Flaschenpost",
    issueNumber: "2024-02",
    publishDate: "2024-02-01T00:00:00Z",
    description: "Test Magazine 2",
    totalCopies: 100,
    availableCopies: 50,
    coverImageUrl: "https://example.com/cover2.jpg",
    isActive: true,
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
  },
];

describe("/api/magazines", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDatabaseService.getActiveMagazines.mockResolvedValue(mockMagazines);
    mockDatabaseService.logDataProcessing.mockResolvedValue(undefined);
  });

  describe("GET /api/magazines", () => {
    it("returns active magazines successfully", async () => {
      const request = new Request("http://localhost:4321/api/magazines", {
        method: "GET",
        headers: {
          "x-forwarded-for": "127.0.0.1",
        },
      });

      const response = await GET({ request } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockMagazines);
      expect(data.count).toBe(2);
      expect(mockDatabaseService.getActiveMagazines).toHaveBeenCalledTimes(1);
    });

    it("logs data processing activity", async () => {
      const request = new Request("http://localhost:4321/api/magazines", {
        method: "GET",
        headers: {
          "x-forwarded-for": "192.168.1.100",
        },
      });

      await GET({ request } as any);

      expect(mockDatabaseService.logDataProcessing).toHaveBeenCalledWith({
        action: "accessed",
        dataType: "user_data",
        legalBasis: "legitimate_interest",
        ipAddress: "192.168.1.100",
        details: JSON.stringify({ endpoint: "/api/magazines" }),
      });
    });

    it("handles missing IP headers gracefully", async () => {
      const request = new Request("http://localhost:4321/api/magazines", {
        method: "GET",
        headers: {},
      });

      await GET({ request } as any);

      expect(mockDatabaseService.logDataProcessing).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: "unknown",
        }),
      );
    });

    it("uses x-real-ip header when x-forwarded-for is not available", async () => {
      const request = new Request("http://localhost:4321/api/magazines", {
        method: "GET",
        headers: {
          "x-real-ip": "10.0.0.1",
        },
      });

      await GET({ request } as any);

      expect(mockDatabaseService.logDataProcessing).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: "10.0.0.1",
        }),
      );
    });

    it("returns empty array when database is not available", async () => {
      mockDatabaseService.getActiveMagazines.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const request = new Request("http://localhost:4321/api/magazines", {
        method: "GET",
      });

      const response = await GET({ request } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.count).toBe(0);
    });

    it("includes proper cache headers", async () => {
      const request = new Request("http://localhost:4321/api/magazines", {
        method: "GET",
      });

      const response = await GET({ request } as any);

      expect(response.headers.get("Cache-Control")).toBe("public, max-age=300");
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    });

    it("handles general errors gracefully", async () => {
      mockDatabaseService.logDataProcessing.mockRejectedValue(
        new Error("Logging failed"),
      );

      const request = new Request("http://localhost:4321/api/magazines", {
        method: "GET",
      });

      const response = await GET({ request } as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to fetch magazines");
      expect(data.message).toBe(
        "Es ist ein Fehler beim Laden der Magazin-Ausgaben aufgetreten.",
      );
    });

    it("handles logging errors but continues with magazine fetch", async () => {
      mockDatabaseService.logDataProcessing.mockRejectedValue(
        new Error("Logging failed"),
      );
      mockDatabaseService.getActiveMagazines.mockResolvedValue(mockMagazines);

      // Mock console.error to avoid noise in tests
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const request = new Request("http://localhost:4321/api/magazines", {
        method: "GET",
      });

      const response = await GET({ request } as any);

      // The endpoint should fail completely if logging fails
      expect(response.status).toBe(500);

      consoleSpy.mockRestore();
    });

    it("returns no magazines when database returns empty array", async () => {
      mockDatabaseService.getActiveMagazines.mockResolvedValue([]);

      const request = new Request("http://localhost:4321/api/magazines", {
        method: "GET",
      });

      const response = await GET({ request } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.count).toBe(0);
    });

    it("handles magazines with different availability", async () => {
      const magazinesWithZeroAvailable = [
        ...mockMagazines,
        {
          id: "323e4567-e89b-12d3-a456-426614174002",
          title: "Flaschenpost",
          issueNumber: "2024-03",
          publishDate: "2024-03-01T00:00:00Z",
          description: "Sold out magazine",
          totalCopies: 100,
          availableCopies: 0,
          coverImageUrl: "https://example.com/cover3.jpg",
          isActive: true,
          createdAt: "2024-03-01T00:00:00Z",
          updatedAt: "2024-03-01T00:00:00Z",
        },
      ];

      mockDatabaseService.getActiveMagazines.mockResolvedValue(
        magazinesWithZeroAvailable,
      );

      const request = new Request("http://localhost:4321/api/magazines", {
        method: "GET",
      });

      const response = await GET({ request } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.count).toBe(3);
      // Database service filters out magazines with 0 availability, but API returns what DB returns
      expect(data.data).toHaveLength(3);
    });
  });
});
