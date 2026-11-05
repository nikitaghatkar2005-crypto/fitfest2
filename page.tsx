import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getEvent() {
  try {
    return await prisma.event.findFirst({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const event = await getEvent();

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Fitfest Platform</h1>
        <p className="text-slate-600 mb-6 max-w-md">
          No published event yet. Complete the one-time setup to seed Fitfest 2026.
        </p>
        <Link
          href="/setup"
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          Go to Setup
        </Link>
      </div>
    );
  }

  const primary = event.primaryColor || "#0066FF";
  const secondary = event.secondaryColor || "#FF6B00";

  return (
    <div className="min-h-screen" style={{ backgroundColor: event.backgroundColor || "#F5F5F5", color: event.textColor || "#0A1628" }}>
      <header className="sticky top-0 z-50 shadow-md" style={{ backgroundColor: primary }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-bold text-white text-lg tracking-wide">{event.name}</div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/90">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/about" className="hover:text-white">About</Link>
            <Link href="/agenda" className="hover:text-white">Schedule</Link>
            <Link href="/sponsors" className="hover:text-white">Sponsors</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </nav>
          <Link
            href="/registration"
            className="px-4 py-2 rounded-lg font-semibold text-sm transition hover:scale-105"
            style={{ backgroundColor: secondary, color: "#fff" }}
          >
            Register Now
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 text-center">
          <p className="text-sm font-semibold tracking-widest uppercase mb-3 opacity-80">{event.category}</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight" style={{ fontFamily: "Montserrat, sans-serif" }}>
            {event.name}
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90" style={{ color: secondary }}>{event.tagline}</p>
          <p className="max-w-2xl mx-auto text-base md:text-lg opacity-80 mb-10 whitespace-pre-line">
            {event.description?.slice(0, 280)}…
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/registration"
              className="px-8 py-3.5 rounded-xl font-semibold text-white shadow-lg hover:scale-105 transition"
              style={{ backgroundColor: secondary }}
            >
              Register Now
            </Link>
            <Link
              href="/agenda"
              className="px-8 py-3.5 rounded-xl font-semibold border-2 hover:scale-105 transition"
              style={{ borderColor: primary, color: primary }}
            >
              View Schedule
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg mb-2">When</h3>
          <p className="opacity-80">
            {new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            {" – "}
            {new Date(event.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p className="text-sm opacity-70 mt-1">{event.startTime} – {event.endTime}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg mb-2">Where</h3>
          <p className="opacity-80">{event.venueName}</p>
          <p className="text-sm opacity-70 mt-1">{event.venueAddress}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg mb-2">Organiser</h3>
          <p className="opacity-80">{event.organizerName}</p>
          <p className="text-sm opacity-70 mt-1">{event.organizerEmail}</p>
        </div>
      </section>

      <section className="py-16 text-center" style={{ backgroundColor: primary }}>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to play, perform & stay fit?</h2>
        <Link
          href="/registration"
          className="inline-block px-8 py-3.5 rounded-xl font-semibold text-white hover:scale-105 transition"
          style={{ backgroundColor: secondary }}
        >
          Register Now
        </Link>
      </section>

      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          <div>
            <h4 className="font-bold text-white mb-3">{event.name}</h4>
            <p className="text-sm opacity-80">{event.tagline}</p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-3">Quick Links</h4>
            <div className="flex flex-col gap-1 text-sm">
              <Link href="/about" className="hover:text-white">About</Link>
              <Link href="/registration" className="hover:text-white">Registration</Link>
              <Link href="/contact" className="hover:text-white">Contact</Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white mb-3">Contact</h4>
            <p className="text-sm">{event.organizerEmail}</p>
            <p className="text-sm">{event.organizerPhone}</p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-8 pt-6 border-t border-slate-700 text-center text-xs opacity-60">
          © 2026 {event.name}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
