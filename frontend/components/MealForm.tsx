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
  const [showMicronutrients, setShowMicronutrients] = useState(false);
  const [formData, setFormData] = useState({
    foodName: initialData?.foodName || meal?.foodName || '',
    quantity: initialData?.quantity || meal?.quantity || '',
    mealType: initialData?.mealType || meal?.mealType || 'Breakfast',
    calories: initialData?.calories || meal?.calories || '',
    protein: initialData?.protein || meal?.protein || '',
    carbs: initialData?.carbs || meal?.carbs || '',
    fat: initialData?.fat || meal?.fat || '',
    date: (() => {
      const dateValue = initialData?.date || meal?.date;
      return dateValue ? new Date(dateValue).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    })(),
    micronutrients: initialData?.micronutrients || meal?.micronutrients || {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      console.log('MealForm: initialData received:', initialData);
      console.log('MealForm: micronutrients in initialData:', initialData.micronutrients);
      
      setFormData(prev => {
        // Merge micronutrients properly - use initialData values if they exist, otherwise keep previous
        const mergedMicronutrients = {
          ...prev.micronutrients,
          ...(initialData.micronutrients || {}),
        };
        
        console.log('MealForm: merged micronutrients:', mergedMicronutrients);
        
        return {
          ...prev,
          foodName: initialData.foodName !== undefined ? initialData.foodName : prev.foodName,
          quantity: initialData.quantity !== undefined ? initialData.quantity : prev.quantity,
          mealType: initialData.mealType !== undefined ? initialData.mealType : prev.mealType,
          calories: initialData.calories !== undefined ? initialData.calories : prev.calories,
          protein: initialData.protein !== undefined && initialData.protein !== null ? initialData.protein : prev.protein,
          carbs: initialData.carbs !== undefined && initialData.carbs !== null ? initialData.carbs : prev.carbs,
          fat: initialData.fat !== undefined && initialData.fat !== null ? initialData.fat : prev.fat,
          date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : prev.date,
          micronutrients: mergedMicronutrients,
        };
      });
      
      // Show micronutrients section if meal has micronutrients
      if (initialData.micronutrients && Object.keys(initialData.micronutrients).length > 0) {
        console.log('MealForm: Expanding micronutrients section, keys:', Object.keys(initialData.micronutrients));
        setShowMicronutrients(true);
      }
    }
    // Show micronutrients section if editing a meal with micronutrients
    if (meal?.micronutrients && Object.keys(meal.micronutrients).length > 0) {
      setShowMicronutrients(true);
    }
  }, [initialData, meal]);

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
      // Clean micronutrients - remove undefined/null values
      const cleanedMicronutrients = Object.fromEntries(
        Object.entries(formData.micronutrients || {}).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      );

      const submitData = {
        ...formData,
        micronutrients: Object.keys(cleanedMicronutrients).length > 0 ? cleanedMicronutrients : undefined,
      };

      if (meal) {
        await api.put(`/api/meals/${meal.id}`, submitData);
        toast.success('Meal updated successfully');
      } else {
        await api.post('/api/meals', submitData);
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
        setShowMicronutrients(false);
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

      {/* Micronutrients Section */}
      <div className="border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={() => setShowMicronutrients(!showMicronutrients)}
          className="flex items-center justify-between w-full text-left mb-4"
        >
          <div>
            <h3 className="text-sm font-medium text-gray-900">Micronutrients (Optional)</h3>
            <p className="text-xs text-gray-500 mt-0.5">Add vitamins and minerals</p>
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
          {meal ? 'Update Meal' : 'Add Meal'}
        </Button>
      </div>
    </form>
  );
}
