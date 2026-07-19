export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mx-auto max-w-[82rem] px-4 pb-4 pt-5 sm:px-6 sm:pb-6 sm:pt-7 lg:px-8">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-1 max-w-3xl text-[clamp(1.7rem,3.2vw,2.5rem)] font-semibold leading-[1.14] tracking-[-0.04em] text-slate-950">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-[0.95rem] sm:leading-7">{description}</p>
    </div>
  )
}
