import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white via-slate-50 to-slate-100 px-6 py-20">
      <div className="max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-600">
          VR Stroke Rehabilitation
        </p>
        <h1 className="mt-4 text-4xl font-bold text-slate-900 md:text-5xl">
          Real-time insights for clinicians and patients
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Monitor Unity Quest therapy sessions, track smoothness, balance, and
          final scores, and share progress transparently.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full bg-teal-600 px-8 py-3 text-base font-semibold text-white transition hover:bg-teal-700"
          >
            Open Dashboard
          </Link>
          <a
            href="https://github.com/Quddos/vr-rehabilitation"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-teal-200 px-8 py-3 text-base font-semibold text-teal-700 transition hover:border-teal-400 hover:text-teal-900"
          >
            Learn about The working stack
          </a>
        </div>
      </div>
    </main>
  );
}
