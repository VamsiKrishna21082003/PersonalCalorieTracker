'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import WeightLogForm from '@/components/WeightLogForm';
import WeightTrendChart from '@/components/charts/WeightTrendChart';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import api from '@/lib/api';
import { format } from 'date-fns';

interface WeightEntry {
  id: string;
  weight: number;
  date: string;
  createdAt: string;
}

export default function WeightPage() {
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [currentGoal, setCurrentGoal] = useState<any>(null);

  const fetchWeightEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: `${filters.startDate}T00:00:00Z`,
        endDate: `${filters.endDate}T23:59:59Z`,
      });

      const [response, goalRes] = await Promise.all([
        api.get(`/api/weight?${params.toString()}`),
        api.get('/api/goals/current').catch(() => ({ data: null })),
      ]);

      // Sort by date descending (most recent first)
      const sortedEntries = (response.data.entries || []).sort((a: WeightEntry, b: WeightEntry) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setWeightEntries(sortedEntries);
      setCurrentGoal(goalRes?.data || null);
    } catch (error) {
      console.error('Failed to fetch weight entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeightEntries();
  }, [filters]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this weight entry?')) {
      return;
    }

    try {
      await api.delete(`/api/weight/${id}`);
      fetchWeightEntries();
    } catch (error) {
      console.error('Failed to delete weight entry:', error);
    }
  };

  if (loading && weightEntries.length === 0) {
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

  const latestWeight = weightEntries.length > 0 ? weightEntries[0] : null;
  const goalWeight = currentGoal?.weightGoal;
  const difference = latestWeight && goalWeight && goalWeight > 0 
    ? latestWeight.weight - goalWeight 
    : null;

  return (
    <ProtectedRoute>
      <div className="flex-1 p-8 bg-gray-50">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Weight Tracking</h1>
            <p className="text-sm text-gray-600">Log and track your weight progress</p>
          </div>

          {/* Date Range Filter */}
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
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
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
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
              <div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    setFilters({ startDate: thirtyDaysAgo, endDate: today });
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          {/* Log Weight Form */}
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-6">Log Weight</h2>
            <WeightLogForm onSuccess={fetchWeightEntries} />
          </Card>

          {/* Weight Summary */}
          {(latestWeight || goalWeight) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestWeight && (
                <Card hover>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 mb-2">Current Weight</p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {latestWeight.weight.toFixed(1)} kg
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(latestWeight.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </Card>
              )}
              {goalWeight && goalWeight > 0 && (
                <Card hover>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 mb-2">Goal Weight</p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {goalWeight.toFixed(1)} kg
                    </p>
                    <p className="text-xs text-gray-500">Target</p>
                  </div>
                </Card>
              )}
              {difference !== null && (
                <Card hover>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 mb-2">Difference</p>
                    <p className={`text-3xl font-bold mb-1 ${
                      Math.abs(difference) < 0.5 
                        ? 'text-green-600' 
                        : difference > 0 
                          ? 'text-yellow-600' 
                          : 'text-blue-600'
                    }`}>
                      {difference > 0 ? '+' : ''}{difference.toFixed(1)} kg
                    </p>
                    <p className="text-xs text-gray-500">
                      {difference > 0 ? 'Above goal' : difference < 0 ? 'Below goal' : 'At goal'}
                    </p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Weight Trend Chart */}
          {weightEntries.length > 0 && (
            <Card
              header={<h2 className="text-base font-semibold text-gray-900">Weight Trend</h2>}
            >
              <div className="pt-4">
                <WeightTrendChart 
                  data={weightEntries.map(entry => ({
                    date: entry.date,
                    weight: entry.weight,
                  }))} 
                />
              </div>
            </Card>
          )}

          {/* Weight Entries List */}
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-6">Weight History</h2>
            {weightEntries.length > 0 ? (
              <div className="space-y-3">
                {weightEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {entry.weight.toFixed(1)} kg
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(entry.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No weight entries"
                description="Log your weight to start tracking your progress."
              />
            )}
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
