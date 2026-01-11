'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
)

type Props = {
  data: {
    date: string
    total: number
  }[]
}

export default function DownloadsChart({ data }: Props) {
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Downloads',
        data: data.map(d => d.total),
      },
    ],
  }

  return (
    <div style={{ maxWidth: 700, marginTop: 32 }}>
      <h2>📈 Downloads por dia</h2>

      <Bar
        data={chartData}
        options={{
          responsive: true,
          plugins: {
            legend: { display: false },
          },
        }}
      />
    </div>
  )
}
