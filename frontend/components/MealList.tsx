'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { format } from 'date-fns';
import MealForm from './MealForm';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';

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

interface MealListProps {
  meals: Meal[];
  onUpdate: () => void;
}

export default function MealList({ meals, onUpdate }: MealListProps) {
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meal?')) return;

    setDeletingId(id);
    try {
      await api.delete(`/api/meals/${id}`);
      toast.success('Meal deleted successfully');
      onUpdate();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete meal';
      console.error('Failed to delete meal:', error);
      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const mealsByType = meals.reduce((acc, meal) => {
    if (!acc[meal.mealType]) {
      acc[meal.mealType] = [];
    }
    acc[meal.mealType].push(meal);
    return acc;
  }, {} as Record<string, Meal[]>);

  const mealTypeOrder = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  return (
    <div>
      {editingMeal && (
        <div className="bg-gray-50 p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Edit Meal</h3>
            <button
              onClick={() => setEditingMeal(null)}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
          <MealForm
            meal={editingMeal}
            onSuccess={() => {
              setEditingMeal(null);
              onUpdate();
            }}
          />
        </div>
      )}

      {meals.length === 0 ? (
        <EmptyState
          title="No meals found"
          description="Start tracking your nutrition by adding your first meal entry."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Food Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Meal Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Calories
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Protein
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Carbs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Micronutrients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {meals.map((meal) => (
                <tr
                  key={meal.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{meal.foodName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{meal.mealType}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{meal.quantity}g</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 font-medium">{meal.calories} kcal</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{meal.protein ? `${meal.protein}g` : '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{meal.carbs ? `${meal.carbs}g` : '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{meal.fat ? `${meal.fat}g` : '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    {meal.micronutrients && Object.keys(meal.micronutrients).length > 0 ? (
                      <div className="text-xs text-gray-600 max-w-xs">
                        {Object.entries(meal.micronutrients)
                          .slice(0, 3)
                          .map(([key, value]) => {
                            const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim();
                            return (
                              <div key={key} className="truncate">
                                {formattedKey}: {typeof value === 'number' ? value.toFixed(1) : value}
                              </div>
                            );
                          })}
                        {Object.keys(meal.micronutrients).length > 3 && (
                          <div className="text-gray-400">+{Object.keys(meal.micronutrients).length - 3} more</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {format(new Date(meal.date), 'MMM d, yyyy')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingMeal(meal)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(meal.id)}
                        disabled={deletingId === meal.id}
                        loading={deletingId === meal.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
