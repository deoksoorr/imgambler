import { useState, useEffect } from 'react'

const AVATAR_COUNT = 8
const getRandomSeed = () => Math.random().toString(36).substring(2, 10)
const getAvatarUrl = (seed: string) => `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}`

export default function AvatarPicker({ onClose }: { onClose: () => void }) {
  // SSR/CSR hydration 불일치 방지: 초기값은 빈 배열, useEffect에서만 랜덤 seed 생성
  const [seeds, setSeeds] = useState<string[]>([])
  const [selected, setSelected] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const newSeeds = Array.from({ length: AVATAR_COUNT }, getRandomSeed)
    setSeeds(newSeeds)
    setSelected(newSeeds[0])
  }, [])

  const handleRandom = () => {
    const newSeeds = Array.from({ length: AVATAR_COUNT }, getRandomSeed)
    setSeeds(newSeeds)
    setSelected(newSeeds[0])
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: getAvatarUrl(selected) })
      })
      if (res.ok) {
        onClose()
        window.location.reload()
      } else {
        alert('Failed to update avatar.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-4 justify-center mb-4">
        {seeds.map(seed => (
          <button
            key={seed}
            className={`border-2 rounded-full p-1 ${selected === seed ? 'border-blue-500' : 'border-gray-300'}`}
            onClick={() => setSelected(seed)}
            type="button"
          >
            <img src={getAvatarUrl(seed)} alt="avatar" className="w-16 h-16 rounded-full bg-white" />
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-4 gap-2">
        <button
          onClick={handleRandom}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          type="button"
        >
          Random
        </button>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
            type="button"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            type="button"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
} 