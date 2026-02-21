'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Button from './ui/Button';

interface Goal {
  id: string;
  dailyCalories: number;
  dailyProtein?: number | null;
  dailyCarbs?: number | null;
  dailyFat?: number | null;
  weightGoal?: number | null;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
}

interface GoalFormProps {
  goal?: Goal | null;
  onSuccess?: () => void;
}

export default function GoalForm({ goal, onSuccess }: GoalFormProps) {
  const [formData, setFormData] = useState({
    dailyCalories: goal?.dailyCalories || '',
    dailyProtein: goal?.dailyProtein || '',
    dailyCarbs: goal?.dailyCarbs || '',
    dailyFat: goal?.dailyFat || '',
    weightGoal: goal?.weightGoal || '',
    startDate: goal?.startDate ? new Date(goal.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    endDate: goal?.endDate ? new Date(goal.endDate).toISOString().split('T')[0] : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (goal) {
        await api.put(`/api/goals/${goal.id}`, formData);
        toast.success('Goal updated successfully');
      } else {
        await api.post('/api/goals', formData);
        toast.success('Goal created successfully');
      }
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to save goal';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="dailyCalories" className="block text-sm font-medium text-gray-700 mb-2">
          Daily Calorie Target *
        </label>
        <input
          type="number"
          id="dailyCalories"
          required
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={formData.dailyCalories}
          onChange={(e) => setFormData({ ...formData, dailyCalories: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <label htmlFor="dailyProtein" className="block text-sm font-medium text-gray-700 mb-2">
            Protein (g)
          </label>
          <input
            type="number"
            step="0.1"
            id="dailyProtein"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
            value={formData.dailyProtein}
            onChange={(e) => setFormData({ ...formData, dailyProtein: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="dailyCarbs" className="block text-sm font-medium text-gray-700 mb-2">
            Carbs (g)
          </label>
          <input
            type="number"
            step="0.1"
            id="dailyCarbs"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
            value={formData.dailyCarbs}
            onChange={(e) => setFormData({ ...formData, dailyCarbs: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="dailyFat" className="block text-sm font-medium text-gray-700 mb-2">
            Fat (g)
          </label>
          <input
            type="number"
            step="0.1"
            id="dailyFat"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
            value={formData.dailyFat}
            onChange={(e) => setFormData({ ...formData, dailyFat: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label htmlFor="weightGoal" className="block text-sm font-medium text-gray-700 mb-2">
          Weight Goal (kg)
        </label>
        <input
          type="number"
          step="0.1"
          id="weightGoal"
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={formData.weightGoal}
          onChange={(e) => setFormData({ ...formData, weightGoal: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
            End Date (optional)
          </label>
          <input
            type="date"
            id="endDate"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" loading={loading}>
          {goal ? 'Update Goal' : 'Create Goal'}
        </Button>
      </div>
    </form>
  );
}
