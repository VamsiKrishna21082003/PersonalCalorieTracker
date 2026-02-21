'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import MealForm from '@/components/MealForm';
import MealList from '@/components/MealList';
import AIExtractionForm from '@/components/AIExtractionForm';
import PDFImport from '@/components/PDFImport';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import api from '@/lib/api';

interface Meal {
  id: string;
  foodName: string;
  quantity: number;
  mealType: string;
  calories: number;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  date: string;
}

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    mealType: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [entryMode, setEntryMode] = useState<'manual' | 'ai' | 'pdf'>('manual');

  const fetchMeals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.mealType) params.append('mealType', filters.mealType);

      const response = await api.get(`/api/meals?${params.toString()}`);
      setMeals(response.data.meals);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch meals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, [pagination.page, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  if (loading && meals.length === 0) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center bg-gray-50 min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex-1 p-8 bg-gray-50">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Meal Entries</h1>
            <p className="text-sm text-gray-600">Manage your meal entries and track nutrition</p>
          </div>

          {/* Horizontal Filter Bar */}
          <Card hover={false}>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm transition-colors"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm transition-colors"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meal Type
                </label>
                <select
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm transition-colors"
                  value={filters.mealType}
                  onChange={(e) => handleFilterChange('mealType', e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snacks">Snacks</option>
                </select>
              </div>
              <div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setFilters({ startDate: '', endDate: '', mealType: '' });
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </Card>

          {/* Meal Form */}
          <Card>
            <div className="flex border-b border-gray-200 mb-6 -mx-6 px-6">
              <button
                onClick={() => setEntryMode('manual')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  entryMode === 'manual'
                    ? 'border-b-2 border-blue-600 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Manual Entry
              </button>
              <button
                onClick={() => setEntryMode('ai')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  entryMode === 'ai'
                    ? 'border-b-2 border-blue-600 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                AI Extraction
              </button>
              <button
                onClick={() => setEntryMode('pdf')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  entryMode === 'pdf'
                    ? 'border-b-2 border-blue-600 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                PDF Import
              </button>
            </div>
            {entryMode === 'manual' ? (
              <MealForm onSuccess={fetchMeals} />
            ) : entryMode === 'ai' ? (
              <AIExtractionForm onSuccess={fetchMeals} />
            ) : (
              <PDFImport onSuccess={fetchMeals} />
            )}
          </Card>

          {/* Meal List */}
          <Card>
            <MealList meals={meals} onUpdate={fetchMeals} />
          </Card>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <Button
                variant="outline"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
