import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white via-slate-50 to-slate-100 px-6 py-20">
      <div className="max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">
          Trust‑Aware Blockchain‑XR
        </p>
        <h1 className="mt-4 text-4xl font-bold text-slate-900 md:text-5xl">
          Rehabilitation & adaptive IoMT insights
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Real-time telemetry and trust signals from XR rehabilitation sessions — visualized for clinicians and administrators.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full bg-[#06b6d4] px-8 py-3 text-base font-semibold text-white transition hover:bg-[#0891b2]"
          >
            Open Trust Dashboard
          </Link>
          <a
            href="https://github.com/Quddos/Blockchain_XR_IoMT"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-[#ccfbfe] px-8 py-3 text-base font-semibold text-[#06b6d4] transition hover:border-[#8beaf5] hover:text-[#064e57]"
          >
            Read the research
          </a>
        </div>
      </div>
    </main>
  );
}
