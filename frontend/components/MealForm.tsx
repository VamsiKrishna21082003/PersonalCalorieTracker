'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Button from './ui/Button';

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
  micronutrients?: any;
}

interface MealFormProps {
  meal?: Meal | null;
  onSuccess?: () => void;
  initialData?: Partial<Meal>;
}

export default function MealForm({ meal, onSuccess, initialData }: MealFormProps) {
  const [formData, setFormData] = useState({
    foodName: initialData?.foodName || meal?.foodName || '',
    quantity: initialData?.quantity || meal?.quantity || '',
    mealType: initialData?.mealType || meal?.mealType || 'Breakfast',
    calories: initialData?.calories || meal?.calories || '',
    protein: initialData?.protein || meal?.protein || '',
    carbs: initialData?.carbs || meal?.carbs || '',
    fat: initialData?.fat || meal?.fat || '',
    date: initialData?.date || meal?.date ? new Date(initialData?.date || meal?.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    micronutrients: initialData?.micronutrients || meal?.micronutrients || {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : prev.date,
      }));
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (meal) {
        await api.put(`/api/meals/${meal.id}`, formData);
        toast.success('Meal updated successfully');
      } else {
        await api.post('/api/meals', formData);
        toast.success('Meal added successfully');
        // Reset form for new entries
        setFormData({
          foodName: '',
          quantity: '',
          mealType: 'Breakfast',
          calories: '',
          protein: '',
          carbs: '',
          fat: '',
          date: new Date().toISOString().split('T')[0],
          micronutrients: {},
        });
      }
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to save meal';
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

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label htmlFor="foodName" className="block text-sm font-medium text-gray-700 mb-2">
            Food Name *
          </label>
          <input
            type="text"
            id="foodName"
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
            value={formData.foodName}
            onChange={(e) => setFormData({ ...formData, foodName: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="mealType" className="block text-sm font-medium text-gray-700 mb-2">
            Meal Type *
          </label>
          <select
            id="mealType"
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
            value={formData.mealType}
            onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
          >
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Snacks">Snacks</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
            Quantity (g/units) *
          </label>
          <input
            type="number"
            step="0.1"
            id="quantity"
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
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
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label htmlFor="calories" className="block text-sm font-medium text-gray-700 mb-2">
          Calories (kcal) *
        </label>
        <input
          type="number"
          step="0.1"
          id="calories"
          required
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          value={formData.calories}
          onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <label htmlFor="protein" className="block text-sm font-medium text-gray-700 mb-2">
            Protein (g)
          </label>
          <input
            type="number"
            step="0.1"
            id="protein"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
            value={formData.protein}
            onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="carbs" className="block text-sm font-medium text-gray-700 mb-2">
            Carbs (g)
          </label>
          <input
            type="number"
            step="0.1"
            id="carbs"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
            value={formData.carbs}
            onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="fat" className="block text-sm font-medium text-gray-700 mb-2">
            Fat (g)
          </label>
          <input
            type="number"
            step="0.1"
            id="fat"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors"
            value={formData.fat}
            onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" loading={loading}>
          {meal ? 'Update Meal' : 'Add Meal'}
        </Button>
      </div>
    </form>
  );
}
