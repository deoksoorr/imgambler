'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

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

export default function EditOnlineCasinoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [casino, setCasino] = useState<OnlineCasino | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCasino();
  }, [params.id]);

  const fetchCasino = async () => {
    try {
      const response = await fetch(`/api/admin/online-casinos/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch casino');
      const data = await response.json();
      setCasino(data);
    } catch (error) {
      console.error('Error fetching casino:', error);
      toast.error('카지노 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!casino) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/online-casinos/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(casino),
      });

      if (!response.ok) throw new Error('Failed to update casino');
      
      toast.success('카지노 정보가 수정되었습니다.');
      router.push('/admin/online-casinos');
    } catch (error) {
      console.error('Error updating casino:', error);
      toast.error('카지노 정보 수정에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!casino) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">카지노를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">카지노 정보 수정</h1>
        <button
          onClick={() => router.push('/admin/online-casinos')}
          className="text-gray-600 hover:text-gray-900"
        >
          목록으로 돌아가기
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카지노 이름
              </label>
              <input
                type="text"
                value={casino.name}
                onChange={(e) => setCasino({ ...casino, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                로고 URL
              </label>
              <input
                type="url"
                value={casino.logoUrl || ''}
                onChange={(e) => setCasino({ ...casino, logoUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설립 연도
              </label>
              <input
                type="number"
                value={casino.establishedYear || ''}
                onChange={(e) => setCasino({ ...casino, establishedYear: parseInt(e.target.value) || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                운영사
              </label>
              <input
                type="text"
                value={casino.operator || ''}
                onChange={(e) => setCasino({ ...casino, operator: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                라이선스
              </label>
              <input
                type="text"
                value={casino.license || ''}
                onChange={(e) => setCasino({ ...casino, license: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                평균 평점
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={casino.avgRating || ''}
                onChange={(e) => setCasino({ ...casino, avgRating: parseFloat(e.target.value) || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                출금 속도
              </label>
              <input
                type="text"
                value={casino.withdrawalSpeed || ''}
                onChange={(e) => setCasino({ ...casino, withdrawalSpeed: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최소 입금액
              </label>
              <input
                type="number"
                value={casino.minDeposit || ''}
                onChange={(e) => setCasino({ ...casino, minDeposit: parseInt(e.target.value) || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최소 출금액
              </label>
              <input
                type="number"
                value={casino.minWithdrawal || ''}
                onChange={(e) => setCasino({ ...casino, minWithdrawal: parseInt(e.target.value) || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                출금 한도
              </label>
              <input
                type="number"
                value={casino.withdrawalLimit || ''}
                onChange={(e) => setCasino({ ...casino, withdrawalLimit: parseInt(e.target.value) || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                방문 URL
              </label>
              <input
                type="url"
                value={casino.visitUrl || ''}
                onChange={(e) => setCasino({ ...casino, visitUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                리뷰 URL
              </label>
              <input
                type="url"
                value={casino.reviewUrl || ''}
                onChange={(e) => setCasino({ ...casino, reviewUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설명
              </label>
              <textarea
                value={casino.description || ''}
                onChange={(e) => setCasino({ ...casino, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                리뷰
              </label>
              <textarea
                value={casino.review || ''}
                onChange={(e) => setCasino({ ...casino, review: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={casino.isMobileSupported}
                  onChange={(e) => setCasino({ ...casino, isMobileSupported: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">모바일 지원</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/admin/online-casinos')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  );
} 