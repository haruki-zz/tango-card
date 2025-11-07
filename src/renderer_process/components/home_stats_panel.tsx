interface HomeStatsPanelItem {
  readonly label: string;
  readonly value: string;
  readonly hint: string;
}

interface HomeStatsPanelProps {
  readonly items: HomeStatsPanelItem[];
}

export function HomeStatsPanel({ items }: HomeStatsPanelProps) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_25px_60px_rgba(15,23,42,0.55)] backdrop-blur">
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <article
            key={item.label}
            className="rounded-2xl border border-white/5 bg-black/15 p-4 text-slate-100 shadow-inner shadow-white/5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold">{item.value}</p>
            <p className="text-xs text-white/60">{item.hint}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
