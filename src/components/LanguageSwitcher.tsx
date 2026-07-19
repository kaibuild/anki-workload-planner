export function LanguageSwitcher({ locale, label, english, japanese, onChange }: { locale: 'en' | 'ja'; label: string; english: string; japanese: string; onChange: (locale: 'en' | 'ja') => void }) {
  return (
    <div aria-label={label} className="inline-flex rounded-lg bg-slate-100 p-0.5" role="group">
      {([['en', english], ['ja', japanese]] as const).map(([value, text]) => (
        <button
          className={`min-h-11 rounded-md px-2.5 text-sm font-medium transition sm:px-3 ${locale === value ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}
          key={value}
          lang={value}
          type="button"
          aria-pressed={locale === value}
          onClick={() => onChange(value)}
        >
          {text}
        </button>
      ))}
    </div>
  )
}
