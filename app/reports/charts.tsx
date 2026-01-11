'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

type ChartProps = {
  data: any[]
  dataKey: string
  title: string
}

export function SimpleBarChart({ data, dataKey, title }: ChartProps) {
  return (
    <div style={{ width: '100%', height: 300, marginBottom: 40 }}>
      <h3>{title}</h3>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey={dataKey} fill="#2563eb" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
