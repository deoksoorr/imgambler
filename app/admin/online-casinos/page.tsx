'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
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
  createdAt: string;
  updatedAt: string;
}

export default function AdminOnlineCasinosPage() {
  const router = useRouter();
  const [casinos, setCasinos] = useState<OnlineCasino[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCasinos();
  }, []);

  const fetchCasinos = async () => {
    try {
      const response = await fetch('/api/admin/online-casinos');
      if (!response.ok) throw new Error('Failed to fetch casinos');
      const data = await response.json();
      setCasinos(data);
    } catch (error) {
      console.error('Error fetching casinos:', error);
      toast.error('카지노 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말로 이 카지노를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/online-casinos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete casino');
      
      toast.success('카지노가 삭제되었습니다.');
      fetchCasinos();
    } catch (error) {
      console.error('Error deleting casino:', error);
      toast.error('카지노 삭제에 실패했습니다.');
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Online Casinos 관리</h1>
        <button
          onClick={() => router.push('/admin/online-casinos/new')}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          새 카지노 등록
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                로고
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이름
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                운영사
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                평점
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                등록일
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {casinos.map((casino) => (
              <tr key={casino.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {casino.logoUrl ? (
                    <img
                      src={casino.logoUrl}
                      alt={casino.name}
                      className="h-10 w-10 object-contain"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-gray-200 rounded"></div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{casino.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{casino.operator || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {casino.avgRating ? casino.avgRating.toFixed(1) : '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(casino.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => router.push(`/admin/online-casinos/${casino.id}/edit`)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(casino.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 