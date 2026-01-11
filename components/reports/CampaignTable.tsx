export function CampaignTable({ data }: { data: any[] }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Campanha</th>
            <th className="text-right p-2">Plays</th>
            <th className="text-right p-2">Tempo (s)</th>
            <th className="text-right p-2">Tempo</th>
          </tr>
        </thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.campaign} className="border-b">
              <td className="p-2">{c.campaign}</td>
              <td className="p-2 text-right">{c.totalPlays}</td>
              <td className="p-2 text-right">{c.totalSeconds}</td>
              <td className="p-2 text-right">
                {formatTime(c.totalSeconds)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return `${h}h ${m}m ${s}s`;
}
