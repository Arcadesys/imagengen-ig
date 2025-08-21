import { describe, it, expect, vi, beforeEach } from "vitest"
import { GET, DELETE } from "../app/api/admin/email-signups/route"
import { NextRequest } from "next/server"

// Mock the admin module
vi.mock("../lib/admin", () => ({
  isAdminRequest: vi.fn(),
}))

// Mock the database
vi.mock("../lib/db", () => ({
  prisma: {
    emailSignup: {
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

// Import the mocked isAdminRequest after mocking
import { isAdminRequest } from "../lib/admin"

describe("Admin Email Signups API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET endpoint", () => {
    it("should return 401 when not authenticated as admin", async () => {
      // Mock isAdminRequest to return false
      vi.mocked(isAdminRequest).mockReturnValue(false)

      const request = new NextRequest("http://localhost:3000/api/admin/email-signups")

      const response = await GET(request)
      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.error).toBe("Unauthorized")
    })

    it("should proceed when authenticated as admin", async () => {
      // Mock isAdminRequest to return true
      vi.mocked(isAdminRequest).mockReturnValue(true)

      // Mock database responses
      const { prisma } = await import("../lib/db")
      vi.mocked(prisma.emailSignup.findMany).mockResolvedValue([])
      vi.mocked(prisma.emailSignup.count).mockResolvedValue(0)
      vi.mocked(prisma.emailSignup.groupBy).mockResolvedValue([])

      const request = new NextRequest("http://localhost:3000/api/admin/email-signups")

      const response = await GET(request)
      expect(response.status).toBe(200)

      // Verify isAdminRequest was called with the request
      expect(isAdminRequest).toHaveBeenCalledWith(request)
    })
  })

  describe("DELETE endpoint", () => {
    it("should return 401 when not authenticated as admin", async () => {
      // Mock isAdminRequest to return false
      vi.mocked(isAdminRequest).mockReturnValue(false)

      const request = new NextRequest("http://localhost:3000/api/admin/email-signups?email=test@example.com")

      const response = await DELETE(request)
      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.error).toBe("Unauthorized")
    })

    it("should proceed when authenticated as admin", async () => {
      // Mock isAdminRequest to return true
      vi.mocked(isAdminRequest).mockReturnValue(true)

      // Mock database response
      const { prisma } = await import("../lib/db")
      vi.mocked(prisma.emailSignup.delete).mockResolvedValue({
        id: "test-id",
        email: "test@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
        verified: false,
        active: true,
        preferences: null,
        source: null,
      })

      const request = new NextRequest("http://localhost:3000/api/admin/email-signups?email=test@example.com")

      const response = await DELETE(request)
      expect(response.status).toBe(200)

      // Verify isAdminRequest was called with the request
      expect(isAdminRequest).toHaveBeenCalledWith(request)
    })
  })
})