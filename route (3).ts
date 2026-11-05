import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    // Check if any super admin already exists
    const existing = await prisma.user.findFirst({
      where: {
        roles: { some: { role: { name: "SUPER_ADMIN" } } },
      },
    });

    if (existing) {
      return NextResponse.json({
        needsSetup: false,
        message: "Setup already completed",
      });
    }

    return NextResponse.json({ needsSetup: true });
  } catch (error: any) {
    // Database not ready or connection issue
    return NextResponse.json({
      needsSetup: true,
      error: error?.message || "Database not ready",
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password || password.length < 8) {
      return NextResponse.json(
        { error: "Name, email and password (min 8 chars) are required" },
        { status: 400 }
      );
    }

    // Prevent re-setup
    const existingAdmin = await prisma.user.findFirst({
      where: {
        roles: { some: { role: { name: "SUPER_ADMIN" } } },
      },
    });
    if (existingAdmin) {
      return NextResponse.json(
        { error: "Setup already completed. Login instead." },
        { status: 403 }
      );
    }

    // Ensure roles exist
    const roles = [
      { name: "SUPER_ADMIN", description: "Full system access", isSystem: true },
      { name: "EVENT_MANAGER", description: "Manage event content and registrations", isSystem: true },
      { name: "REGISTRATION_MANAGER", description: "Manage registrations and check-ins", isSystem: true },
      { name: "SPEAKER_MANAGER", description: "Manage speakers", isSystem: true },
      { name: "SPONSOR_MANAGER", description: "Manage sponsors", isSystem: true },
      { name: "STALL_MANAGER", description: "Manage stalls", isSystem: true },
      { name: "ARTIST_MANAGER", description: "Manage artists and performers", isSystem: true },
      { name: "CHECKIN_STAFF", description: "QR check-in only", isSystem: true },
    ];

    for (const r of roles) {
      await prisma.role.upsert({
        where: { name: r.name },
        update: {},
        create: r,
      });
    }

    const superAdminRole = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } });
    if (!superAdminRole) {
      return NextResponse.json({ error: "Failed to create roles" }, { status: 500 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        roles: {
          create: { roleId: superAdminRole.id },
        },
      },
    });

    // Seed default Fitfest event
    const event = await prisma.event.create({
      data: {
        name: "Fitfest 2026",
        tagline: "Play Perform Stay Fit",
        description: `FITFEST 2026 is a two-day College Sports and Fitness Festival organised by Academic Sports and Fitness Academy exclusively for college students aged 18–25 years.

The event aims to promote physical fitness, sportsmanship, teamwork and a healthy lifestyle through various sports competitions and fitness activities.

Students can participate in cricket, football, volleyball, basketball, relay races, tug of war, Zumba, yoga, aerobics and exciting fitness challenges.

The festival will provide an opportunity for students to showcase their sporting talents, interact with fitness professionals and enjoy two days of sports and entertainment.`,
        category: "Sports, Fitness, Health and Wellness",
        theme: "Play, Perform, Stay Fit",
        startDate: new Date("2026-11-05T00:00:00+05:30"),
        endDate: new Date("2026-11-06T00:00:00+05:30"),
        startTime: "09:00",
        endTime: "17:30",
        timezone: "Asia/Kolkata",
        venueName: "College Sports Ground and Indoor Auditorium",
        venueAddress: "College campus",
        googleMapsUrl: "CIPET GROUND",
        organizerName: "Academic Sports and Fitness Academy",
        organizerEmail: "fitfest2026@gmail.com",
        organizerPhone: "1234567897",
        websiteUrl: "https://www.fitfest.in",
        socialLinks: {
          instagram: "@Fitfest",
          whatsapp: "To communicate and give information",
        },
        primaryColor: "#0066FF",
        secondaryColor: "#FF6B00",
        backgroundColor: "#F5F5F5",
        textColor: "#0A1628",
        fontHeading: "Montserrat",
        fontBody: "Poppins",
        isPublished: true,
        registrationMode: "OPEN",
      },
    });

    // Default pages
    const pages = [
      { slug: "home", title: "Home", sortOrder: 0 },
      { slug: "about", title: "About the Event", sortOrder: 1 },
      { slug: "agenda", title: "Event Agenda", sortOrder: 2 },
      { slug: "speakers", title: "Speakers", sortOrder: 3 },
      { slug: "sponsors", title: "Sponsors", sortOrder: 4 },
      { slug: "registration", title: "Registration", sortOrder: 5 },
      { slug: "venue", title: "Venue and Location", sortOrder: 6 },
      { slug: "contact", title: "Contact", sortOrder: 7 },
      { slug: "privacy", title: "Privacy Policy", sortOrder: 8 },
      { slug: "terms", title: "Terms and Conditions", sortOrder: 9 },
    ];

    for (const p of pages) {
      await prisma.eventPage.create({
        data: {
          eventId: event.id,
          slug: p.slug,
          title: p.title,
          isEnabled: true,
          sortOrder: p.sortOrder,
        },
      });
    }

    // Default ticket types
    const ticketTypes = [
      { name: "General Participant", description: "Open to all college students", price: 0, sortOrder: 0 },
      { name: "VIP", description: "VIP access", price: 0, sortOrder: 1 },
      { name: "Speaker", description: "Invited speakers and trainers", price: 0, sortOrder: 2 },
      { name: "Volunteer", description: "Event volunteers", price: 0, sortOrder: 3 },
    ];

    for (const t of ticketTypes) {
      await prisma.ticketType.create({
        data: {
          eventId: event.id,
          name: t.name,
          description: t.description,
          price: t.price,
          sortOrder: t.sortOrder,
          isActive: true,
        },
      });
    }

    // Basic form fields
    const generalTicket = await prisma.ticketType.findFirst({
      where: { eventId: event.id, name: "General Participant" },
    });

    if (generalTicket) {
      const fields = [
        { label: "Full Name", fieldKey: "fullName", fieldType: "text", isRequired: true, sortOrder: 0 },
        { label: "Email Address", fieldKey: "email", fieldType: "email", isRequired: true, sortOrder: 1 },
        { label: "Mobile Number", fieldKey: "phone", fieldType: "phone", isRequired: true, sortOrder: 2 },
        { label: "College / Organization", fieldKey: "organization", fieldType: "text", isRequired: true, sortOrder: 3 },
        { label: "City", fieldKey: "city", fieldType: "text", isRequired: false, sortOrder: 4 },
      ];

      for (const f of fields) {
        await prisma.registrationFormField.create({
          data: {
            eventId: event.id,
            ticketTypeId: generalTicket.id,
            ...f,
          },
        });
      }
    }

    // Default confirmation email template
    await prisma.emailTemplate.create({
      data: {
        eventId: event.id,
        name: "Registration Confirmation",
        subject: "You're registered for {{event_name}} – Ticket {{ticket_number}}",
        bodyHtml: `
          <h1>Registration Confirmed!</h1>
          <p>Hi {{participant_name}},</p>
          <p>Thank you for registering for <strong>{{event_name}}</strong>.</p>
          <p><strong>Ticket Number:</strong> {{ticket_number}}<br/>
          <strong>Registration ID:</strong> {{registration_id}}</p>
          <p>Date: {{event_date}}<br/>Venue: {{event_venue}}</p>
          <p>Your QR code is attached / available on your ticket page.</p>
          <p>If you have questions, contact your SPOC: {{spoc_name}} ({{spoc_email}} / {{spoc_phone}})</p>
          <p>See you at Fitfest!</p>
        `,
        type: "TRANSACTIONAL",
        isDefault: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Setup complete. You can now log in.",
      userId: user.id,
      eventId: event.id,
    });
  } catch (error: any) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: error?.message || "Setup failed. Check DATABASE_URL and try again." },
      { status: 500 }
    );
  }
}
