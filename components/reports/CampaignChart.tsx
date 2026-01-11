export function CampaignChart({ data }: { data: any[] }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <h3 className="mb-4 font-semibold">
        Tempo exibido por campanha (min)
      </h3>

      <div className="space-y-2">
        {data.map((c) => (
          <div key={c.campaign}>
            <div className="text-sm">{c.campaign}</div>
            <div className="h-2 w-full bg-gray-200 rounded">
              <div
                className="h-2 bg-blue-600 rounded"
                style={{
                  width: `${Math.min(
                    100,
                    (c.totalSeconds / data[0].totalSeconds) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
