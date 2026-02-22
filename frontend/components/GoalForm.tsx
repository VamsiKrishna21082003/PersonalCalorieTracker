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
  micronutrients?: any;
}

interface GoalFormProps {
  goal?: Goal | null;
  onSuccess?: () => void;
}

const getInitialFormData = (goal?: Goal | null) => ({
  dailyCalories: goal?.dailyCalories ?? '',
  dailyProtein: goal?.dailyProtein ?? '',
  dailyCarbs: goal?.dailyCarbs ?? '',
  dailyFat: goal?.dailyFat ?? '',
  weightGoal: goal?.weightGoal ?? '',
  startDate: goal?.startDate
    ? new Date(goal.startDate).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0],
  endDate: goal?.endDate ? new Date(goal.endDate).toISOString().split('T')[0] : '',
  micronutrients: goal?.micronutrients || {},
});

export default function GoalForm({ goal, onSuccess }: GoalFormProps) {
  const [showMicronutrients, setShowMicronutrients] = useState(false);
  const [formData, setFormData] = useState(getInitialFormData(goal));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(getInitialFormData(goal));
    setShowMicronutrients(
      !!(goal?.micronutrients && Object.keys(goal.micronutrients).length > 0)
    );
  }, [goal]);

  const handleMicronutrientChange = (key: string, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    setFormData({
      ...formData,
      micronutrients: {
        ...formData.micronutrients,
        [key]: numValue !== undefined && !isNaN(numValue) ? numValue : undefined,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Normalize micronutrients to numeric values only.
      const normalizedMicronutrients = Object.fromEntries(
        Object.entries(formData.micronutrients || {})
          .map(([key, value]) => {
            const numericValue =
              typeof value === 'number'
                ? value
                : typeof value === 'string' && value.trim() !== ''
                ? Number(value)
                : NaN;
            return [key, numericValue] as const;
          })
          .filter(([, value]) => Number.isFinite(value))
      );

      const submitData: any = {
        dailyCalories: formData.dailyCalories,
        dailyProtein: formData.dailyProtein,
        dailyCarbs: formData.dailyCarbs,
        dailyFat: formData.dailyFat,
        weightGoal: formData.weightGoal,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        micronutrients:
          Object.keys(normalizedMicronutrients).length > 0
            ? normalizedMicronutrients
            : null,
      };

      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('Submitting goal data:', {
          isUpdate: !!goal,
          goalId: goal?.id,
          submitData,
          formDataMicronutrients: formData.micronutrients,
          normalizedMicronutrients,
          goalMicronutrients: goal?.micronutrients,
        });
      }

      if (goal) {
        await api.put(`/api/goals/${goal.id}`, submitData);
        toast.success('Goal updated successfully');
      } else {
        await api.post('/api/goals', submitData);
        toast.success('Goal created successfully');
      }
      // Reset form after successful submission
      if (!goal) {
        setFormData({
          dailyCalories: '',
          dailyProtein: '',
          dailyCarbs: '',
          dailyFat: '',
          weightGoal: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          micronutrients: {},
        });
        setShowMicronutrients(false);
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

      {/* Micronutrients Section */}
      <div className="border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={() => setShowMicronutrients(!showMicronutrients)}
          className="flex items-center justify-between w-full text-left mb-4"
        >
          <div>
            <h3 className="text-sm font-medium text-gray-900">Micronutrient Goals (Optional)</h3>
            <p className="text-xs text-gray-500 mt-0.5">Set daily targets for vitamins and minerals</p>
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${showMicronutrients ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showMicronutrients && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="vitaminA" className="block text-sm font-medium text-gray-700 mb-2">
                Vitamin A (mcg)
              </label>
              <input
                type="number"
                step="0.1"
                id="vitaminA"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm transition-colors"
                value={formData.micronutrients?.vitaminA || ''}
                onChange={(e) => handleMicronutrientChange('vitaminA', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="vitaminC" className="block text-sm font-medium text-gray-700 mb-2">
                Vitamin C (mg)
              </label>
              <input
                type="number"
                step="0.1"
                id="vitaminC"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm transition-colors"
                value={formData.micronutrients?.vitaminC || ''}
                onChange={(e) => handleMicronutrientChange('vitaminC', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="iron" className="block text-sm font-medium text-gray-700 mb-2">
                Iron (mg)
              </label>
              <input
                type="number"
                step="0.1"
                id="iron"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm transition-colors"
                value={formData.micronutrients?.iron || ''}
                onChange={(e) => handleMicronutrientChange('iron', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="calcium" className="block text-sm font-medium text-gray-700 mb-2">
                Calcium (mg)
              </label>
              <input
                type="number"
                step="0.1"
                id="calcium"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm transition-colors"
                value={formData.micronutrients?.calcium || ''}
                onChange={(e) => handleMicronutrientChange('calcium', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="vitaminD" className="block text-sm font-medium text-gray-700 mb-2">
                Vitamin D (IU)
              </label>
              <input
                type="number"
                step="0.1"
                id="vitaminD"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm transition-colors"
                value={formData.micronutrients?.vitaminD || ''}
                onChange={(e) => handleMicronutrientChange('vitaminD', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="vitaminE" className="block text-sm font-medium text-gray-700 mb-2">
                Vitamin E (mg)
              </label>
              <input
                type="number"
                step="0.1"
                id="vitaminE"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm transition-colors"
                value={formData.micronutrients?.vitaminE || ''}
                onChange={(e) => handleMicronutrientChange('vitaminE', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="vitaminK" className="block text-sm font-medium text-gray-700 mb-2">
                Vitamin K (mcg)
              </label>
              <input
                type="number"
                step="0.1"
                id="vitaminK"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm transition-colors"
                value={formData.micronutrients?.vitaminK || ''}
                onChange={(e) => handleMicronutrientChange('vitaminK', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="magnesium" className="block text-sm font-medium text-gray-700 mb-2">
                Magnesium (mg)
              </label>
              <input
                type="number"
                step="0.1"
                id="magnesium"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm transition-colors"
                value={formData.micronutrients?.magnesium || ''}
                onChange={(e) => handleMicronutrientChange('magnesium', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="zinc" className="block text-sm font-medium text-gray-700 mb-2">
                Zinc (mg)
              </label>
              <input
                type="number"
                step="0.1"
                id="zinc"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm transition-colors"
                value={formData.micronutrients?.zinc || ''}
                onChange={(e) => handleMicronutrientChange('zinc', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="potassium" className="block text-sm font-medium text-gray-700 mb-2">
                Potassium (mg)
              </label>
              <input
                type="number"
                step="0.1"
                id="potassium"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm transition-colors"
                value={formData.micronutrients?.potassium || ''}
                onChange={(e) => handleMicronutrientChange('potassium', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="sodium" className="block text-sm font-medium text-gray-700 mb-2">
                Sodium (mg)
              </label>
              <input
                type="number"
                step="0.1"
                id="sodium"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm transition-colors"
                value={formData.micronutrients?.sodium || ''}
                onChange={(e) => handleMicronutrientChange('sodium', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="phosphorus" className="block text-sm font-medium text-gray-700 mb-2">
                Phosphorus (mg)
              </label>
              <input
                type="number"
                step="0.1"
                id="phosphorus"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm transition-colors"
                value={formData.micronutrients?.phosphorus || ''}
                onChange={(e) => handleMicronutrientChange('phosphorus', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" loading={loading}>
          {goal ? 'Update Goal' : 'Create Goal'}
        </Button>
      </div>
    </form>
  );
}
