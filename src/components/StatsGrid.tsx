interface Stat {
  label: string;
  value: string | number;
  icon:  string;
  color: string;
  sub?:  string;
}

export function StatsGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className={`card ${s.color} border-0`}>
          <div className="text-2xl mb-2">{s.icon}</div>
          <div className="text-2xl font-bold mb-0.5">{s.value}</div>
          <div className="text-sm font-medium opacity-80">{s.label}</div>
          {s.sub && <div className="text-xs opacity-60 mt-0.5">{s.sub}</div>}
        </div>
      ))}
    </div>
  );
}
