type Props = {
  status: string;
};

export function FinanceTimeline({ status }: Props) {
  const steps = [
    { key: 'PENDING', label: 'Processado' },
    { key: 'CHECKING', label: 'Conferência' },
    { key: 'VERIFIED', label: 'Documento válido' },
    { key: 'CLOSED', label: 'Encerrado' }
  ];

  const activeIndex = steps.findIndex(s => s.key === status);

  return (
    <div className="flex gap-4">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              i <= activeIndex ? 'bg-green-600' : 'bg-gray-300'
            }`}
          />
          <span
            className={`text-sm ${
              i <= activeIndex ? 'text-green-700' : 'text-gray-400'
            }`}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
