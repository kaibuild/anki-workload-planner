export function TrustStrip({ strip, local, connection }: { strip: string; local: string; connection: string }) {
  return (
    <aside className="border-b border-slate-200/70 bg-white" aria-label={strip}>
      <div className="mx-auto flex max-w-[82rem] flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-[0.7rem] leading-5 text-slate-600 sm:px-6 lg:px-8">
        <strong className="inline-flex items-center gap-2 font-semibold">
          <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-teal-700 text-white" aria-hidden="true">
            <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none"><path d="m4 8 2.4 2.4L12 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          {strip}
        </strong>
        <span className="before:mr-2 before:text-slate-300 before:content-['•']">{local}</span>
        <span className="before:mr-2 before:text-slate-300 before:content-['•']">{connection}</span>
      </div>
    </aside>
  )
}
