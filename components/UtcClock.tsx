'use client'

import { useEffect, useState } from 'react'

export default function UtcClock() {
  // SSR/CSR hydration 불일치 방지: 초기값은 ''로 두고, useEffect에서만 시간 값을 갱신
  const [now, setNow] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const utc = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC+0'
      setNow(utc)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="text-sm text-center bg-gray-900 text-gray-300 py-2">
      Real Time: {now}
    </div>
  )
}