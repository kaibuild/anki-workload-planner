export function RecommendationSummary({ title, text, deterministicNote }: { title: string; text: string; deterministicNote: string }) {
  return (
    <section className="rounded-2xl border border-teal-200 bg-teal-50 p-5" aria-labelledby="recommendation-heading">
      <p className="eyebrow">{deterministicNote}</p>
      <h2 className="mt-1 text-lg font-semibold text-teal-950" id="recommendation-heading">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-teal-950">{text}</p>
    </section>
  )
}
