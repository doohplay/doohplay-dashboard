'use client';

import { useEffect, useState } from 'react';

type Campaign = {
  campaign_id: string;
  net_amount: number;
  executions_count: number;
};

type Closure = {
  id: string;
  reference: string;
  status: string;
  gross_amount: number;
  net_amount: number;
  created_at: string;
  document?: {
    signed_at: string;
    is_valid: boolean;
  };
  campaigns?: Campaign[];
};

export default function FinancePage() {
  const [closures, setClosures] = useState<Closure[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/closures') // 👈 use a rota REAL que já existe
      .then(res => res.json())
      .then(setClosures)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-6">Carregando financeiro...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">📊 Financeiro</h1>

      {closures.map(c => (
        <div key={c.id} className="border rounded-lg bg-white">
          {/* Cabeçalho */}
          <button
            onClick={() => setOpenId(openId === c.id ? null : c.id)}
            className="w-full p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-medium">Referência {c.reference}</p>
              <p className="text-sm text-gray-500">
                {new Date(c.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div className="flex gap-4 items-center">
              <span className="font-semibold">
                R$ {c.net_amount.toLocaleString('pt-BR')}
              </span>

              <span
                className={`px-2 py-1 rounded text-xs ${
                  c.status === 'VERIFIED'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {c.status}
              </span>
            </div>
          </button>

          {/* Detalhes */}
          {openId === c.id && (
            <div className="border-t p-4 space-y-4">
              {c.document?.is_valid && (
                <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                  ✅ Documento válido – assinado em {c.document.signed_at}
                </div>
              )}

              {c.campaigns && (
                <table className="w-full text-sm border rounded">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">Campanha</th>
                      <th className="p-2 text-right">Execuções</th>
                      <th className="p-2 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.campaigns.map(cam => (
                      <tr key={cam.campaign_id} className="border-t">
                        <td className="p-2 font-mono text-xs">
                          {cam.campaign_id}
                        </td>
                        <td className="p-2 text-right">
                          {cam.executions_count.toLocaleString('pt-BR')}
                        </td>
                        <td className="p-2 text-right">
                          R$ {cam.net_amount.toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="flex gap-3">
                <a
                  href={`/api/closures/${c.id}/document`}
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  📄 Documento
                </a>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
