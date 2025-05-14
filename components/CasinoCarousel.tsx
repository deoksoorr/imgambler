"use client";
import { useState, useEffect } from "react";

interface Casino {
  id: number;
  name: string;
  imageUrl: string;
  safetyLevel: string;
  link: string;
  type: string;
}

function CasinoCard({ casino }: { casino: Casino }) {
  return (
    <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center w-[270px] max-w-full mx-2 border border-gray-200">
      <img
        src={casino.imageUrl}
        alt={casino.name}
        className="w-full h-20 object-cover rounded mb-3"
      />
      <div className="font-bold text-gray-900 text-lg mb-3 text-center">{casino.name}</div>
      <div className="text-gray-700 text-sm mb-0 text-center font-semibold">
        SAFETY INDEX:<br />
        <span className="text-green-600 font-bold text-base">{casino.safetyLevel}</span>
      </div>
      <a
        href={casino.link.startsWith('http') ? casino.link : `https://${casino.link}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg w-full text-center text-base transition mt-3"
      >
        Visit Casino
      </a>
    </div>
  );
}

export default function CasinoCarousel() {
  const [tab, setTab] = useState<'best' | 'new'>('best');
  const [casinos, setCasinos] = useState<Casino[]>([]);
  const [startIdx, setStartIdx] = useState(0);
  const [intervalMs, setIntervalMs] = useState(4000);

  const filtered = casinos.filter(c => c.type === tab);

  useEffect(() => {
    fetch('/api/casinos').then(res => res.json()).then(setCasinos);
    fetch('/api/casinos/speed')
      .then(res => res.ok ? res.json() : { intervalMs: 4000 })
      .then(data => setIntervalMs(data.intervalMs || 4000))
      .catch(() => setIntervalMs(4000));
  }, []);

  // 자동 슬라이드 전환
  useEffect(() => {
    if (filtered.length <= 3) return;
    const interval = setInterval(() => {
      setStartIdx(prev => {
        if (prev + 3 >= filtered.length) return 0;
        return prev + 3;
      });
    }, intervalMs); // 동적으로 적용
    return () => clearInterval(interval);
  }, [filtered.length, intervalMs]);

  const visible = filtered.slice(startIdx, startIdx + 3);
  const pageCount = Math.ceil(filtered.length / 3);
  const currentPage = Math.floor(startIdx / 3);

  return (
    <div className="max-w-4xl mx-auto mt-8 mb-10 bg-white">
      <div className="flex justify-center gap-2 mb-6">
        <button
          className={`px-6 py-2 rounded-full font-bold text-base shadow-sm transition-all duration-150 ${tab === 'best' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
          onClick={() => { setTab('best'); setStartIdx(0); }}
        >
          BEST CASINOS
        </button>
        <button
          className={`px-6 py-2 rounded-full font-bold text-base shadow-sm transition-all duration-150 ${tab === 'new' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
          onClick={() => { setTab('new'); setStartIdx(0); }}
        >
          NEW CASINOS
        </button>
      </div>
      <div className="flex gap-6 justify-center">
        {visible.length === 0 ? (
          <div className="text-gray-400 p-8">No casinos registered.</div>
        ) : (
          visible.map(casino => <CasinoCard key={casino.id} casino={casino} />)
        )}
      </div>
      {/* 인디케이터 */}
      <div className="flex justify-center gap-2 mt-4">
        {Array.from({length: pageCount}).map((_, idx) => (
          <button
            key={idx}
            className={`w-3 h-3 rounded-full transition-all duration-150 ${idx === currentPage ? 'bg-blue-600' : 'bg-gray-300'}`}
            onClick={() => setStartIdx(idx * 3)}
            aria-label={`Go to slide ${idx+1}`}
          />
        ))}
      </div>
      {/* 구분선 */}
      <div className="border-b border-gray-200 mt-8 mb-8"></div>
    </div>
  );
} 