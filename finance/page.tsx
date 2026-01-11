'use client';

import { useEffect, useState } from 'react';

/* ✅ IMPORTS CORRETOS */
import { FinanceTimeline } from './components/FinanceTimeline';
import { DocumentSeal } from './components/DocumentSeal';

/* ================= TYPES ================= */

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

/* ================= PAGE ================= */

export default function FinancePage() {
  const [closures, setClosures] = useState<Closure[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* ✅ ENDPOINT CENTRALIZADO */
  const FINANCE_ENDPOINT =
    process.env.NEXT_PUBLIC_FINANCE_ENDPOINT || '/api/closures';

  useEffect(() => {
    fetch(FINANCE_ENDPOINT)
      .then(res => res.json())
      .then(setClosures)
      .finally(() => setLoading(false));
  }, [FINANCE_ENDPOINT]);

  if (loading) {
    return <p className="p-6">Carregando financeiro...</p>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">📊 Financeiro</h1>

      {closures.map(c => (
        <div key={c.id} className="border rounded-lg bg-white">
          {/* ================= CABEÇALHO ================= */}
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

          {/* ================= DETALHES ==*
