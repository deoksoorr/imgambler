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

export default function OnlineCasinoDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [casino, setCasino] = useState<OnlineCasino | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCasino();
  }, [params.id]);

  const fetchCasino = async () => {
    try {
      const response = await fetch(`/api/online-casinos/${params.id}`);
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
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* 헤더 섹션 */}
        <div className="p-8 border-b">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {casino.logoUrl ? (
                <img
                  src={casino.logoUrl}
                  alt={casino.name}
                  className="h-16 w-auto object-contain"
                />
              ) : (
                <div className="h-16 w-40 bg-gray-200 rounded"></div>
              )}
              <div>
                <h1 className="text-3xl font-bold">{casino.name}</h1>
                {casino.establishedYear && (
                  <p className="text-gray-600">설립: {casino.establishedYear}년</p>
                )}
              </div>
            </div>
            {casino.avgRating && (
              <div className="flex items-center">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-yellow-400">
                      {star <= Math.round(casino.avgRating!) ? (
                        <StarIcon className="h-6 w-6" />
                      ) : (
                        <StarOutlineIcon className="h-6 w-6" />
                      )}
                    </span>
                  ))}
                </div>
                <span className="ml-2 text-xl font-semibold">
                  {casino.avgRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            {casino.visitUrl && (
              <a
                href={casino.visitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                카지노 방문하기
              </a>
            )}
            {casino.reviewUrl && (
              <a
                href={casino.reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
              >
                리뷰 보기
              </a>
            )}
          </div>
        </div>

        {/* 기본 정보 섹션 */}
        <div className="p-8 border-b">
          <h2 className="text-2xl font-semibold mb-4">기본 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">운영사</h3>
              <p>{casino.operator || '-'}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">라이선스</h3>
              <p>{casino.license || '-'}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">사이트 언어</h3>
              <div className="flex flex-wrap gap-2">
                {casino.languages.map((lang) => (
                  <span
                    key={lang.id}
                    className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {lang.value}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">고객 지원 언어</h3>
              <div className="flex flex-wrap gap-2">
                {casino.supportLanguages.map((lang) => (
                  <span
                    key={lang.id}
                    className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {lang.value}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">모바일 지원</h3>
              <p>{casino.isMobileSupported ? '지원' : '미지원'}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">출금 속도</h3>
              <p>{casino.withdrawalSpeed || '-'}</p>
            </div>
          </div>
        </div>

        {/* 입출금 정보 섹션 */}
        <div className="p-8 border-b">
          <h2 className="text-2xl font-semibold mb-4">입출금 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">최소 입금액</h3>
              <p>{casino.minDeposit ? `${casino.minDeposit.toLocaleString()}원` : '-'}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">최소 출금액</h3>
              <p>{casino.minWithdrawal ? `${casino.minWithdrawal.toLocaleString()}원` : '-'}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">출금 한도</h3>
              <p>{casino.withdrawalLimit ? `${casino.withdrawalLimit.toLocaleString()}원` : '-'}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">결제 수단</h3>
              <div className="flex flex-wrap gap-2">
                {casino.paymentMethods.map((method) => (
                  <span
                    key={method.id}
                    className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {method.value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 게임 정보 섹션 */}
        <div className="p-8 border-b">
          <h2 className="text-2xl font-semibold mb-4">게임 정보</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">제공 게임</h3>
              <div className="flex flex-wrap gap-2">
                {casino.gameTypes.map((type) => (
                  <span
                    key={type.id}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {type.name}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">게임 공급업체</h3>
              <div className="flex flex-wrap gap-2">
                {casino.providers.map((provider) => (
                  <span
                    key={provider.id}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {provider.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 장단점 섹션 */}
        <div className="p-8 border-b">
          <h2 className="text-2xl font-semibold mb-4">장단점</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">장점</h3>
              <ul className="list-disc list-inside space-y-2">
                {casino.pros.map((pro) => (
                  <li key={pro.id} className="text-gray-600">
                    {pro.value}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">단점</h3>
              <ul className="list-disc list-inside space-y-2">
                {casino.cons.map((con) => (
                  <li key={con.id} className="text-gray-600">
                    {con.value}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 설명 및 리뷰 섹션 */}
        <div className="p-8">
          <div className="space-y-8">
            {casino.description && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">카지노 소개</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-600 whitespace-pre-line">
                    {casino.description}
                  </p>
                </div>
              </div>
            )}
            {casino.review && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">상세 리뷰</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-600 whitespace-pre-line">
                    {casino.review}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 스크린샷 섹션 */}
        {casino.screenshots.length > 0 && (
          <div className="p-8 border-t">
            <h2 className="text-2xl font-semibold mb-4">스크린샷</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {casino.screenshots.map((screenshot) => (
                <img
                  key={screenshot.id}
                  src={screenshot.url}
                  alt={`${casino.name} 스크린샷`}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 