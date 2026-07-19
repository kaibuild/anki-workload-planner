export type GlossaryLabels = {
  heading: string
  description: string
  dueToday: string
  dueTodayDefinition: string
  queue: string
  queueDefinition: string
  overdue: string
  overdueDefinition: string
  hard: string
  hardDefinition: string
}

export function Glossary({ labels }: { labels: GlossaryLabels }) {
  const terms = [
    [labels.dueToday, labels.dueTodayDefinition],
    [labels.queue, labels.queueDefinition],
    [labels.overdue, labels.overdueDefinition],
    [labels.hard, labels.hardDefinition],
  ]
  return (
    <section className="panel" aria-labelledby="glossary-heading">
      <h2 className="section-title" id="glossary-heading">{labels.heading}</h2>
      <p className="section-description">{labels.description}</p>
      <dl className="mt-5 grid gap-x-8 sm:grid-cols-2">
        {terms.map(([term, definition]) => (
          <div className="border-t border-slate-100 py-4" key={term}>
            <dt className="font-semibold text-slate-900">{term}</dt>
            <dd className="mt-1 text-sm leading-6 text-slate-500">{definition}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
