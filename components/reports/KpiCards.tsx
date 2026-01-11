export function KpiCards({ data }: { data: any[] }) {
  const totalSeconds = data.reduce(
    (sum, c) => sum + c.totalSeconds,
    0
  );

  const totalPlays = data.reduce(
    (sum, c) => sum + c.totalPlays,
    0
  );

  const campaigns = data.filter(
    (c) => c.campaign !== 'FALLBACK'
  ).length;

  const fallbackSeconds =
    data.find((c) => c.campaign === 'FALLBACK')
      ?.totalSeconds ?? 0;

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card title="Tempo total exibido" value={`${Math.round(totalSeconds / 60)} min`} />
      <Card title="Total de plays" value={totalPlays} />
      <Card title="Campanhas exibidas" value={campaigns} />
      <Card title="Fallback (min)" value={`${Math.round(fallbackSeconds / 60)}`} />
    </div>
  );
}

function Card({ title, value }: any) {
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
