'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface OnlineCasino {
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
}

const initialCasino: OnlineCasino = {
  name: '',
  logoUrl: null,
  establishedYear: null,
  operator: null,
  license: null,
  isMobileSupported: false,
  avgRating: null,
  withdrawalSpeed: null,
  minDeposit: null,
  minWithdrawal: null,
  withdrawalLimit: null,
  visitUrl: null,
  reviewUrl: null,
  description: null,
  review: null,
};

export default function NewOnlineCasinoPage() {
  const router = useRouter();
  const [casino, setCasino] = useState<OnlineCasino>(initialCasino);
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 드래그 앤 드롭 핸들러
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };
  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return null;
    const formData = new FormData();
    formData.append('file', logoFile);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      let logoUrl = casino.logoUrl;
      if (logoFile) {
        logoUrl = await uploadLogo();
      }
      const response = await fetch('/api/admin/online-casinos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...casino, logoUrl }),
      });
      if (response.status === 401) {
        setError('You are not authorized. Please log in as an admin.');
        toast.error('You are not authorized. Please log in as an admin.');
        return;
      }
      if (!response.ok) throw new Error('Failed to create casino');
      toast.success('Casino successfully registered!');
      router.push('/admin/online-casinos');
    } catch (error) {
      console.error('Error creating casino:', error);
      setError('Failed to create casino.');
      toast.error('Failed to create casino.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Register New Casino</h1>
        <button
          onClick={() => router.push('/admin/online-casinos')}
          className="text-gray-900 hover:text-black"
        >
          Back to List
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Casino Name
              </label>
              <input
                type="text"
                value={casino.name}
                onChange={(e) => setCasino({ ...casino, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Logo Image
              </label>
              <div
                className="w-full h-32 border-2 border-dashed border-blue-400 rounded-md flex items-center justify-center cursor-pointer bg-gray-50 hover:bg-blue-50"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={handleLogoClick}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" className="h-24 object-contain" />
                ) : (
                  <span className="text-gray-700 font-semibold">Drag & Drop or Click to Upload</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Established Year
              </label>
              <input
                type="number"
                value={casino.establishedYear || ''}
                onChange={(e) => setCasino({ ...casino, establishedYear: parseInt(e.target.value) || null })}
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Operator
              </label>
              <input
                type="text"
                value={casino.operator || ''}
                onChange={(e) => setCasino({ ...casino, operator: e.target.value })}
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                License
              </label>
              <input
                type="text"
                value={casino.license || ''}
                onChange={(e) => setCasino({ ...casino, license: e.target.value })}
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Average Rating
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={casino.avgRating || ''}
                onChange={(e) => setCasino({ ...casino, avgRating: parseFloat(e.target.value) || null })}
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Withdrawal Speed
              </label>
              <input
                type="text"
                value={casino.withdrawalSpeed || ''}
                onChange={(e) => setCasino({ ...casino, withdrawalSpeed: e.target.value })}
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Min Deposit
              </label>
              <input
                type="number"
                value={casino.minDeposit || ''}
                onChange={(e) => setCasino({ ...casino, minDeposit: parseInt(e.target.value) || null })}
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Min Withdrawal
              </label>
              <input
                type="number"
                value={casino.minWithdrawal || ''}
                onChange={(e) => setCasino({ ...casino, minWithdrawal: parseInt(e.target.value) || null })}
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Withdrawal Limit
              </label>
              <input
                type="number"
                value={casino.withdrawalLimit || ''}
                onChange={(e) => setCasino({ ...casino, withdrawalLimit: parseInt(e.target.value) || null })}
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Visit URL
              </label>
              <input
                type="url"
                value={casino.visitUrl || ''}
                onChange={(e) => setCasino({ ...casino, visitUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Review URL
              </label>
              <input
                type="url"
                value={casino.reviewUrl || ''}
                onChange={(e) => setCasino({ ...casino, reviewUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Description
              </label>
              <textarea
                value={casino.description || ''}
                onChange={(e) => setCasino({ ...casino, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Review
              </label>
              <textarea
                value={casino.review || ''}
                onChange={(e) => setCasino({ ...casino, review: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center space-x-2 text-sm font-bold text-gray-900">
                <input
                  type="checkbox"
                  checked={casino.isMobileSupported}
                  onChange={(e) => setCasino({ ...casino, isMobileSupported: e.target.checked })}
                  className="rounded border-gray-400 text-blue-600 focus:ring-blue-500"
                />
                <span>Mobile Supported</span>
              </label>
            </div>
          </div>
        </div>
        {error && <div className="text-red-600 font-bold mt-2">{error}</div>}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/admin/online-casinos')}
            className="px-4 py-2 border border-gray-400 rounded-md text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 font-bold"
          >
            {isSaving ? 'Saving...' : 'Register'}
          </button>
        </div>
      </form>
    </div>
  );
} 