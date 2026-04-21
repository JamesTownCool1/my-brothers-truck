import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { ArrowRight, CheckCircle2, MapPin, ShieldCheck, Star, Truck } from 'lucide-react';
import { authOptions } from '@/lib/auth';

/**
 * Landing page — the public face of the app.
 *
 * Design POV: editorial newsprint. Big slab-serif headlines, warm paper
 * background, an orange accent that screams "utility trucks". We lean
 * into an almost brochure-like feel — it distinguishes us from every
 * other sterile SaaS landing page.
 */
export default async function LandingPage() {
  // Signed-in users skip straight to the dashboard
  const session = await getServerSession(authOptions);
  if (session?.user) redirect('/dashboard');

  return (
    <div className="min-h-screen">
      {/* ── Top bar ──────────────────────────────────────── */}
      <nav className="border-b border-ink-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-ink-900 text-white">
              <Truck size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-display text-lg font-black leading-none tracking-tight">
                My Brother&rsquo;s Truck
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
                peer-to-peer moving
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-ink-800 hover:bg-ink-100"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-white hover:bg-ink-800"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-ink-200">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 md:py-32 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 animate-fade-in">
            <span className="stamp text-ink-700">Est. 2025 · San Antonio, TX</span>
            <h1 className="mt-6 font-display text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-black leading-[0.95] tracking-tight text-ink-900">
              Someone nearby.
              <br />
              <span className="text-brand-500 italic">A truck.</span>
              <br />
              Your stuff moved.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-700 leading-relaxed">
              Just bought a couch that doesn&rsquo;t fit in your car? A new TV? A fridge
              from Facebook Marketplace? Post what needs moving and get matched with
              a rated neighbor who has a pickup.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-full bg-brand-500 px-7 py-4 font-semibold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600"
              >
                Find a Truck Now
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/register?role=helper"
                className="inline-flex items-center gap-2 rounded-full border-2 border-ink-900 px-7 py-4 font-semibold text-ink-900 hover:bg-ink-900 hover:text-white"
              >
                Drive & Earn
              </Link>
            </div>

            {/* Trust line */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-600">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-brand-500" /> Rated helpers
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Star size={16} className="text-brand-500" /> Two-way reviews
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-brand-500" /> Secure payments
              </span>
            </div>
          </div>

          {/* Hero visual — a big type-driven "receipt" card, not a stock photo */}
          <div className="lg:col-span-5">
            <div className="relative rotate-[2deg] hover:rotate-0 transition-transform duration-500">
              <div className="rounded-3xl border-2 border-ink-900 bg-white p-6 sm:p-8 shadow-[8px_8px_0_0_#ff7a11]">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-ink-500 border-b-2 border-dashed border-ink-200 pb-3">
                  <span>Job · #MBT-0042</span>
                  <span className="text-emerald-600">Accepted</span>
                </div>
                <div className="mt-5 font-display text-2xl font-bold leading-tight">
                  Couch pickup from IKEA Live Oak
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-brand-200" />
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
                        Pickup
                      </div>
                      <div className="text-ink-900">IKEA, Live Oak, TX</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-ink-900" />
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
                        Dropoff
                      </div>
                      <div className="text-ink-900">Broadway, San Antonio</div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between border-t-2 border-dashed border-ink-200 pt-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
                      Helper
                    </div>
                    <div className="font-semibold">Diego R. · 4.9★</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">
                      Total
                    </div>
                    <div className="font-display text-2xl font-black text-brand-500">
                      $65
                    </div>
                  </div>
                </div>
              </div>

              {/* Offset decorative pill */}
              <div className="absolute -top-4 -left-6 rotate-[-6deg] bg-ink-900 text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                Nearby · 2.1 mi away
              </div>
            </div>
          </div>
        </div>

        {/* Marquee ticker */}
        <div className="border-t border-ink-200 py-4 overflow-hidden bg-ink-900 text-white">
          <div className="flex gap-12 whitespace-nowrap animate-ticker">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-12 shrink-0 items-center text-sm font-semibold uppercase tracking-[0.2em]">
                <span>Couches ✱ Refrigerators ✱ TVs ✱ Mattresses ✱ Dressers ✱ Dorm moves ✱ IKEA runs ✱ Marketplace pickups ✱ Garage sales ✱</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="border-b border-ink-200 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid md:grid-cols-12 gap-8">
            <div className="md:col-span-4">
              <span className="stamp text-ink-700">The Playbook</span>
              <h2 className="mt-4 font-display text-5xl font-black leading-tight">
                Three steps.
                <br />
                Not rocket science.
              </h2>
            </div>
            <div className="md:col-span-8 grid sm:grid-cols-3 gap-6">
              {[
                {
                  n: '01',
                  t: 'Post your job',
                  d: 'Pickup, dropoff, a quick description, rough size. Takes 30 seconds.',
                },
                {
                  n: '02',
                  t: 'Get matched',
                  d: 'Nearby helpers with trucks see your post and claim it. Pick the rating that feels right.',
                },
                {
                  n: '03',
                  t: 'Get it moved',
                  d: 'Chat in-app, track status, pay securely when it&rsquo;s done.',
                },
              ].map((s) => (
                <div key={s.n} className="border-t-2 border-ink-900 pt-4">
                  <div className="font-display text-5xl font-black text-brand-500 leading-none">
                    {s.n}
                  </div>
                  <div className="mt-4 font-display text-xl font-bold">{s.t}</div>
                  <div
                    className="mt-2 text-sm text-ink-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: s.d }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Two-sided CTA ─────────────────────────────────── */}
      <section className="border-b border-ink-200">
        <div className="grid md:grid-cols-2 divide-x-2 divide-ink-200 border-ink-200">
          <div className="p-10 sm:p-14 bg-white">
            <MapPin className="text-brand-500" size={32} />
            <h3 className="mt-4 font-display text-3xl font-black">I need something moved</h3>
            <p className="mt-3 text-ink-700 max-w-md">
              From a new TV to a sofa off Craigslist — post the job, browse helpers,
              pay when you&rsquo;re happy.
            </p>
            <Link
              href="/register"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-600"
            >
              Post a Job
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="p-10 sm:p-14 bg-ink-900 text-white">
            <Truck className="text-brand-400" size={32} />
            <h3 className="mt-4 font-display text-3xl font-black">I have a truck</h3>
            <p className="mt-3 text-ink-200 max-w-md">
              Got a pickup sitting in your driveway? Flip yourself online, pick up
              jobs near you, get paid.
            </p>
            <Link
              href="/register?role=helper"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-400"
            >
              Start Earning
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center text-xs uppercase tracking-[0.2em] text-ink-500">
          © 2025 My Brother&rsquo;s Truck. An MVP. Treat your neighbors well.
        </div>
      </footer>
    </div>
  );
}
