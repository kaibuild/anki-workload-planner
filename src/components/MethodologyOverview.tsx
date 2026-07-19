export type MethodologyLabels = {
  heading: string
  description: string
  workloadHeading: string
  workloadBody: string
  workloadFormula: string
  directionHeading: string
  directionBody: string
  directionFormula: string
  onePassHeading: string
  onePassBody: string
  onePassFormula: string
  targetHeading: string
  targetBody: string
  targetFormula: string
  contextHeading: string
  contextBody: string
}

export function MethodologyOverview({ labels }: { labels: MethodologyLabels }) {
  const items = [
    [labels.workloadHeading, labels.workloadBody, labels.workloadFormula],
    [labels.directionHeading, labels.directionBody, labels.directionFormula],
    [labels.onePassHeading, labels.onePassBody, labels.onePassFormula],
    [labels.targetHeading, labels.targetBody, labels.targetFormula],
  ]

  return (
    <section className="panel" aria-labelledby="method-heading">
      <h2 className="section-title" id="method-heading">{labels.heading}</h2>
      <p className="section-description">{labels.description}</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {items.map(([heading, body, formula]) => (
          <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5" key={heading}>
            <h3 className="font-semibold text-slate-950">{heading}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            <code className="mt-3 block max-w-full overflow-x-auto rounded-xl bg-white px-3 py-2 text-xs leading-5 text-slate-700">{formula}</code>
          </article>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <h3 className="font-semibold text-amber-950">{labels.contextHeading}</h3>
        <p className="mt-1 text-sm leading-6 text-amber-900">{labels.contextBody}</p>
      </div>
    </section>
  )
}
