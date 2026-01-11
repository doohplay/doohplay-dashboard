'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type Closure = {
  id: string;
  reference: string;
  gross_amount: number;
  net_amount: number;
  executions_count: number;
  status: string;
  created_at: string;
};

type Campaign = {
  campaign_id: string;
  net_amount: number;
  executions_count: number;
};

export default function FinanceClosureDetail() {
  const { closureId } = useParams();
  const [closure, setClosure] = useState<Closure | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/finance/closures/${closureId}`).then(r => r.json()),
      fetch(`/api/finance/closures/${closureId}/campaigns`).then(r => r.json())
    ])
      .then(([closureData, campaignsData]) => {
        setClosure(closureData);
        setCampaigns(campaignsData);
      })
      .finally(() => setLoading(false));
  }, [closureId]);

  if (loading) {
    return <p className="p-6">Carregando fechamento...</p>;
  }

  if (!closure) {
    return <p className="p-6 text-red-600">Fechamento não encontrado</p>;
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">
            📁 Fechamento {closure.reference}
          </h1>
          <p className="text-sm text-gray-500">
            Criado em {new Date(closure.created_at).toLocaleString('pt-BR')}
          </p>
        </div>

        <a
          href={`/api/finance/closures/${closure.id}/pdf`}
          target="_blank"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          📄 Baixar PDF
        </a>
      </header>

      {/* Resumo financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Status" value={closure.status} />
        <Card
          title="Valor Bruto"
          value={`R$ ${closure.gross_amount.toLocaleString('pt-BR')}`}
        />
        <Card
          title="Valor Líquido"
          value={`R$ ${closure.net_amount.toLocaleString('pt-BR')}`}
        />
        <Card
          title="Execuções"
          value={closure.executions_count.toLocaleString('pt-BR')}
        />
      </div>

      {/* Campanhas */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">📣 Campanhas incluídas</h2>

        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Campanha</th>
                <th className="p-3 text-right">Execuções</th>
                <th className="p-3 text-right">Valor Líquido</th>
              </tr>
            </thead>

            <tbody>
              {campaigns.map(c => (
                <tr key={c.campaign_id} className="border-t">
                  <td className="p-3 font-mono text-xs">
                    {c.campaign_id}
                  </td>
                  <td className="p-3 text-right">
                    {c.executions_count.toLocaleString('pt-BR')}
                  </td>
                  <td className="p-3 text-right font-medium">
                    R$ {c.net_amount.toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ----------------- */

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="border rounded-lg p-4 bg-white">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
