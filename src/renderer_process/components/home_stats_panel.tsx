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
    <section className="rounded-[40px] bg-white/[0.06] px-6 py-5 text-white shadow-[0_35px_80px_rgba(2,6,23,0.5)] backdrop-blur">
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <article
            key={item.label}
            className="flex flex-col gap-2 rounded-[28px] bg-white/[0.03] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/55">{item.label}</p>
            <p className="text-3xl font-semibold">{item.value}</p>
            <p className="text-xs text-white/60">{item.hint}</p>
            <span className="inline-flex w-12 border-b border-white/30" />
          </article>
        ))}
      </div>
    </section>
  );
}
