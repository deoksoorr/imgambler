"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function OnlineCasinosAdminUI() {
  const [casinos, setCasinos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const didFetch = useRef(false);

  useEffect(() => {
    if (!didFetch.current) {
      fetchCasinos();
      didFetch.current = true;
    }
  }, []);

  const fetchCasinos = async () => {
    try {
      const response = await fetch('/api/admin/online-casinos', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch casinos');
      const data = await response.json();
      setCasinos(data);
    } catch (error) {
      alert('Failed to fetch casino list.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this casino?')) return;
    try {
      const response = await fetch(`/api/admin/online-casinos/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!response.ok) throw new Error('Failed to delete casino');
      alert('Casino deleted successfully.');
      fetchCasinos();
    } catch {
      alert('Failed to delete casino.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Online Casinos List</h3>
        <button
          onClick={() => router.push('/admin/online-casinos/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          + Add Casino
        </button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {casinos.map((casino: any) => (
              <tr key={casino.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {casino.logoUrl ? (
                    <img src={casino.logoUrl} alt={casino.name} className="h-10 w-10 object-contain" />
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
                  <div className="text-sm text-gray-500">{casino.avgRating ? casino.avgRating.toFixed(1) : '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{new Date(casino.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => router.push(`/admin/online-casinos/${casino.id}/edit`)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(casino.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
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