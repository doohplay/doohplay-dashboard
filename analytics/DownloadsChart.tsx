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

interface Props {
  labels: string[]
  values: number[]
}

export default function DownloadsChart({ labels, values }: Props) {
  return (
    <Bar
      data={{
        labels,
        datasets: [
          {
            label: 'Downloads',
            data: values,
            backgroundColor: '#2563eb',
          },
        ],
      }}
      options={{
        responsive: true,
        plugins: {
          legend: { display: false },
        },
      }}
    />
  )
}
