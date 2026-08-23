import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  /**
   * Returns distinct dates (next 30 days) that have at least one
   * class session with available capacity for trials.
   */
  async getAvailableTrialDates() {
    const now = new Date();
    const thirtyDaysOut = new Date();
    thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);

    // Find all sessions in the window that are scheduled (not cancelled)
    const sessions = await this.prisma.classSession.findMany({
      where: {
        date: {
          gte: now,
          lte: thirtyDaysOut,
        },
        status: "scheduled",
        offering: {
          type: "regular", // No trials for flexible courses
        },
      },
      select: {
        date: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    // Deduplicate by date string (multiple sessions on the same day → one date)
    const uniqueDates = [
      ...new Set(
        sessions.map((s) => s.date.toISOString().split("T")[0]),
      ),
    ];

    return uniqueDates.map((dateStr) => {
      const d = new Date(dateStr + "T00:00:00Z");
      return {
        date: dateStr,
        dayOfWeek: d.toLocaleDateString("en-US", {
          weekday: "long",
          timeZone: "UTC",
        }),
      };
    });
  }

  /**
   * Submit a public trial request.
   * Rate-limited by phone number (max 3 pending per phone).
   */
  async submitTrialRequest(data: {
    parentName: string;
    parentPhone: string;
    parentEmail?: string;
    childName: string;
    childAge: number;
    preferredDates: string[];
    locationId?: string;
    locationSlug?: string;
    notes?: string;
    cookieId?: string;
    ipAddress?: string;
  }) {
    // Validate inputs
    if (!data.parentName || data.parentName.trim().length < 2) {
      throw new BadRequestException("Parent name is required");
    }

    if (!data.parentPhone || data.parentPhone.trim().length < 7) {
      throw new BadRequestException("Valid phone number is required");
    }

    if (!data.childName || data.childName.trim().length < 2) {
      throw new BadRequestException("Child name is required");
    }

    if (data.childAge < 0 || data.childAge > 18) {
      throw new BadRequestException("Invalid age");
    }

    if (
      !data.preferredDates ||
      data.preferredDates.length === 0 ||
      data.preferredDates.length > 5
    ) {
      throw new BadRequestException("Select between 1 and 5 preferred dates");
    }

    // Validate date strings
    for (const dateStr of data.preferredDates) {
      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) {
        throw new BadRequestException(`Invalid date: ${dateStr}`);
      }
    }

    // Phone dedup: max 3 pending requests per phone number
    const normalizedPhone = data.parentPhone.replace(/\D/g, "");
    const pendingCount = await this.prisma.trialRequest.count({
      where: {
        parentPhone: normalizedPhone,
        status: "pending",
      },
    });

    if (pendingCount >= 3) {
      throw new HttpException(
        "You already have pending trial requests. We'll be in touch soon!",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Resolve location
    let resolvedLocationId = data.locationId || null;
    let resolvedLocationName = "";

    if (!resolvedLocationId && data.locationSlug) {
      const loc = await this.prisma.location.findUnique({
        where: { slug: data.locationSlug },
      });
      if (loc) {
        resolvedLocationId = loc.id;
        resolvedLocationName = loc.name;
      }
    } else if (resolvedLocationId) {
      const loc = await this.prisma.location.findUnique({
        where: { id: resolvedLocationId },
      });
      if (loc) {
        resolvedLocationName = loc.name;
      }
    }

    // Format notes with location prefix for high visibility
    let finalNotes = data.notes?.trim() || null;
    if (resolvedLocationName && (!finalNotes || !finalNotes.includes(resolvedLocationName))) {
      finalNotes = finalNotes
        ? `[Location: ${resolvedLocationName}] ${finalNotes}`
        : `[Location: ${resolvedLocationName}]`;
    }

    // Create the request
    const request = await this.prisma.trialRequest.create({
      data: {
        parentName: data.parentName.trim(),
        parentPhone: normalizedPhone,
        parentEmail: data.parentEmail?.trim() || null,
        childName: data.childName.trim(),
        childAge: data.childAge,
        preferredDates: data.preferredDates,
        locationId: resolvedLocationId,
        notes: finalNotes,
        cookieId: data.cookieId || null,
        ipAddress: data.ipAddress || null,
      },
    });

    return {
      success: true,
      message:
        "Your trial request has been submitted! We'll be in touch within 24 hours.",
      cookieId: request.cookieId || request.id,
    };
  }

  /**
   * Returns list of public locations for trial booking & contact.
   */
  async getLocations() {
    const locations = await this.prisma.location.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        address: true,
      },
    });

    if (locations.length > 0) {
      return locations;
    }

    // Fallback if database locations table is not populated yet
    return [
      {
        id: "markham",
        name: "Markham Campus",
        slug: "markham",
        address: "100 Town Centre Blvd, Markham, ON L3R 9W3",
      },
      {
        id: "newmarket",
        name: "Newmarket Aquatic Center",
        slug: "newmarket",
        address: "17600 Yonge St, Newmarket, ON L3Y 4Z1",
      },
      {
        id: "richmond-hill",
        name: "Richmond Hill Facility",
        slug: "richmond-hill",
        address: "10268 Yonge St, Richmond Hill, ON L4C 3B7",
      },
    ];
  }

  /**
   * Returns public-safe program/level information.
   */
  async getPrograms() {
    const levels = await this.prisma.level.findMany({
      orderBy: { order: "asc" },
      select: {
        name: true,
        description: true,
        category: true,
        color: true,
        order: true,
      },
    });

    return levels;
  }
}
