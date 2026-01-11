type Props = {
  valid?: boolean;
  signedAt?: string;
  reference: string;
};

export function DocumentSeal({ valid, signedAt, reference }: Props) {
  if (!valid) return null;

  return (
    <div className="border border-green-300 bg-green-50 rounded-lg p-4">
      <p className="text-green-800 font-semibold">
        ✅ Documento Financeiro Válido
      </p>
      <p className="text-sm text-green-700">
        Referência: {reference}
      </p>
      {signedAt && (
        <p className="text-sm text-green-700">
          Assinado em: {signedAt}
        </p>
      )}
    </div>
  );
}
