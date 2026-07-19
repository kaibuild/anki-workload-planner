export type PrivacyLabels = {
  heading: string
  localHeading: string
  localDescription: string
  connection: string
  limitationsHeading: string
  limitations: string
  destructive: string
  hardHeading: string
  hardCan: string
  hardCannot: string
}

export function PrivacyAndLimitations({ labels }: { labels: PrivacyLabels }) {
  return (
    <section className="panel" aria-labelledby="privacy-heading">
      <h2 className="section-title" id="privacy-heading">{labels.heading}</h2>
      <div className="mt-5 grid gap-0 overflow-hidden rounded-2xl border border-slate-200 lg:grid-cols-2">
        <div className="border-b border-slate-200 bg-teal-50/60 p-5 lg:border-r lg:border-b-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-teal-600" aria-hidden="true" />
            <h3 className="font-semibold text-teal-950">{labels.localHeading}</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-teal-950/80">{labels.localDescription}</p>
          <p className="mt-2 text-sm leading-6 text-teal-950/80">{labels.connection}</p>
        </div>
        <div className="p-5">
          <h3 className="font-semibold">{labels.limitationsHeading}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{labels.limitations}</p>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-800">{labels.destructive}</p>
        </div>
      </div>
      <div className="mt-5 border-l-2 border-slate-200 pl-4">
        <h3 className="font-semibold">{labels.hardHeading}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{labels.hardCan}</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">{labels.hardCannot}</p>
      </div>
    </section>
  )
}
