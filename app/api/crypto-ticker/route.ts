import { NextResponse } from 'next/server'

const COINS = [
  'bitcoin',
  'ethereum',
  'tether',
  'litecoin',
  'ripple',
  'dogecoin',
]

export async function GET() {
  const ids = COINS.join(',')
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
  const res = await fetch(url, { next: { revalidate: 60 } })
  const data = await res.json()
  return NextResponse.json(data)
} 