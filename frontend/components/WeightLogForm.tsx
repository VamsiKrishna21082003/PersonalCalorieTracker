'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Button from './ui/Button';

interface WeightLogFormProps {
  onSuccess?: () => void;
}

export default function WeightLogForm({ onSuccess }: WeightLogFormProps) {
  const [formData, setFormData] = useState({
    weight: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.weight || parseFloat(formData.weight) <= 0) {
        setError('Please enter a valid weight');
        return;
      }

      await api.post('/api/weight', {
        weight: parseFloat(formData.weight),
        date: formData.date ? `${formData.date}T00:00:00Z` : undefined,
      });

      toast.success('Weight logged successfully');
      setFormData({
        weight: '',
        date: new Date().toISOString().split('T')[0],
      });
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to log weight';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
            Weight (kg) *
          </label>
          <input
            type="number"
            step="0.1"
            id="weight"
            required
            min="0"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm transition-colors"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            placeholder="e.g., 75.5"
          />
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Date *
          </label>
          <input
            type="date"
            id="date"
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm transition-colors"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          Log Weight
        </Button>
      </div>
    </form>
  );
}
