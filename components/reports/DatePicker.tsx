'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export function DatePicker() {
  const router = useRouter()
  const params = useSearchParams()

  const [start, setStart] = useState(
    params.get('start') ?? ''
  )
  const [end, setEnd] = useState(
    params.get('end') ?? ''
  )

  function apply() {
    if (!start || !end) return

    router.push(
      `/reports?start=${start}&end=${end}`
    )
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input
        type="date"
        value={start}
        onChange={(e) => setStart(e.target.value)}
      />

      <input
        type="date"
        value={end}
        onChange={(e) => setEnd(e.target.value)}
      />

      <button onClick={apply}>
        Aplicar
      </button>
    </div>
  )
}
