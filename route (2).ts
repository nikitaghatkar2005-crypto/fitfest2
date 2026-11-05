import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, ticketTypeId, fullName, email, phone, organization, city, country, answers, invitationCode } = body;

    if (!eventId || !ticketTypeId || !fullName || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event || !event.isPublished) {
      return NextResponse.json({ error: "Event not found or not published" }, { status: 404 });
    }

    const ticketType = await prisma.ticketType.findFirst({
      where: { id: ticketTypeId, eventId, isActive: true },
    });
    if (!ticketType) {
      return NextResponse.json({ error: "Invalid ticket type" }, { status: 400 });
    }

    // Duplicate check
    const existing = await prisma.registration.findFirst({
      where: {
        eventId,
        email: email.toLowerCase().trim(),
        ticketTypeId,
        status: { not: "CANCELLED" },
      },
    });
    if (existing) {
      return NextResponse.json({ error: "You are already registered with this email for this ticket type" }, { status: 409 });
    }

    // Invitation mode check
    if (event.registrationMode === "INVITATION") {
      if (!invitationCode) {
        return NextResponse.json({ error: "Invitation code required" }, { status: 400 });
      }
      const invite = await prisma.invitation.findUnique({ where: { code: invitationCode } });
      if (!invite || invite.status !== "ACTIVE" || invite.eventId !== eventId) {
        return NextResponse.json({ error: "Invalid invitation code" }, { status: 400 });
      }
      if (invite.expiresAt && invite.expiresAt < new Date()) {
        return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
      }
      if (invite.usedCount >= invite.maxUses) {
        return NextResponse.json({ error: "Invitation already used" }, { status: 400 });
      }
    }

    // Generate IDs
    const count = await prisma.registration.count({ where: { eventId } });
    const registrationId = `FIT-2026-${String(count + 1).padStart(4, "0")}`;
    const ticketNumber = `TKT-${uuidv4().slice(0, 8).toUpperCase()}`;
    const verificationToken = uuidv4() + uuidv4().replace(/-/g, "");

    // QR points to verification URL (no personal data inside)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verifyUrl = `${appUrl}/verify?token=${verificationToken}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, { width: 300, margin: 2 });

    const result = await prisma.$transaction(async (tx) => {
      const registration = await tx.registration.create({
        data: {
          eventId,
          ticketTypeId,
          registrationId,
          fullName,
          email: email.toLowerCase().trim(),
          phone,
          organization,
          city,
          country,
          answers: answers || {},
          invitationCode: invitationCode || null,
          status: "CONFIRMED",
        },
      });

      const ticket = await tx.ticket.create({
        data: {
          registrationId: registration.id,
          ticketNumber,
          verificationToken,
          qrCodeDataUrl,
          status: "VALID",
        },
      });

      await tx.ticketType.update({
        where: { id: ticketTypeId },
        data: { soldCount: { increment: 1 } },
      });

      if (invitationCode) {
        await tx.invitation.update({
          where: { code: invitationCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      return { registration, ticket };
    });

    // TODO: queue confirmation email via Resend (requires RESEND_API_KEY)

    return NextResponse.json({
      success: true,
      registrationId: result.registration.registrationId,
      ticketNumber: result.ticket.ticketNumber,
      verificationToken: result.ticket.verificationToken,
      ticketUrl: `${appUrl}/ticket/${result.ticket.verificationToken}`,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error?.message || "Registration failed" }, { status: 500 });
  }
}
