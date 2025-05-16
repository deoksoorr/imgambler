'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

interface OnlineCasino {
  id: number;
  name: string;
  logoUrl: string | null;
  establishedYear: number | null;
  operator: string | null;
  license: string | null;
  isMobileSupported: boolean;
  avgRating: number | null;
  withdrawalSpeed: string | null;
  minDeposit: number | null;
  minWithdrawal: number | null;
  withdrawalLimit: number | null;
  visitUrl: string | null;
  reviewUrl: string | null;
  description: string | null;
  review: string | null;
  providers: { id: number; name: string }[];
  gameTypes: { id: number; name: string; icon: string | null }[];
  languages: { id: number; value: string }[];
  supportLanguages: { id: number; value: string }[];
  pros: { id: number; value: string }[];
  cons: { id: number; value: string }[];
  paymentMethods: { id: number; value: string }[];
  screenshots: { id: number; url: string }[];
}

interface CasinoListResponse {
  casinos: OnlineCasino[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export default function OnlineCasinosPage() {
  const router = useRouter();
  const [casinos, setCasinos] = useState<OnlineCasino[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCasinos();
  }, [category, currentPage]);

  const fetchCasinos = async () => {
    try {
      const response = await fetch(
        `/api/online-casinos?category=${category}&page=${currentPage}`
      );
      if (!response.ok) throw new Error('Failed to fetch casinos');
      const data: CasinoListResponse = await response.json();
      setCasinos(data.casinos);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching casinos:', error);
      toast.error('카지노 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 카테고리 탭 */}
      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setCategory('all')}
          className={`px-4 py-2 rounded-lg ${
            category === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setCategory('recommended')}
          className={`px-4 py-2 rounded-lg ${
            category === 'recommended'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          추천
        </button>
        <button
          onClick={() => setCategory('new')}
          className={`px-4 py-2 rounded-lg ${
            category === 'new'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          신규
        </button>
      </div>

      {/* 카지노 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {casinos.map((casino) => (
          <div
            key={casino.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => router.push(`/online-casinos/${casino.id}`)}
          >
            {/* 카지노 로고 */}
            <div className="h-48 bg-gray-100 flex items-center justify-center p-4">
              {casino.logoUrl ? (
                <img
                  src={casino.logoUrl}
                  alt={casino.name}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-gray-400">No Image</div>
              )}
            </div>

            {/* 카지노 정보 */}
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">{casino.name}</h2>
              <div className="space-y-2">
                {casino.establishedYear && (
                  <p className="text-gray-600">
                    설립: {casino.establishedYear}년
                  </p>
                )}
                {casino.operator && (
                  <p className="text-gray-600">운영사: {casino.operator}</p>
                )}
                {casino.license && (
                  <p className="text-gray-600">라이선스: {casino.license}</p>
                )}
                {casino.withdrawalSpeed && (
                  <p className="text-gray-600">
                    출금 속도: {casino.withdrawalSpeed}
                  </p>
                )}
                {casino.avgRating && (
                  <div className="flex items-center">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="text-yellow-400">
                          {star <= Math.round(casino.avgRating!) ? (
                            <StarIcon className="h-5 w-5" />
                          ) : (
                            <StarOutlineIcon className="h-5 w-5" />
                          )}
                        </span>
                      ))}
                    </div>
                    <span className="ml-2 text-gray-600">
                      {casino.avgRating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 rounded-lg ${
                currentPage === page
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 