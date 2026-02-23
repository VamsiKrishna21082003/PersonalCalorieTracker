'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { format } from 'date-fns';
import MealForm from './MealForm';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';
import Card from './ui/Card';

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
        <div className="space-y-6">
          {mealTypeOrder.map((type) => {
            const typeMeals = mealsByType[type] || [];
            if (typeMeals.length === 0) return null;

            return (
              <Card key={type} hover={false}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{type}</h3>
                <div className="space-y-3">
                  {typeMeals.map((meal) => (
                    <div
                      key={meal.id}
                      className="p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h4 className="text-base font-semibold text-gray-900">{meal.foodName}</h4>
                            <div className="flex gap-2 shrink-0">
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
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                            <span className="text-xs text-gray-500">
                              {format(new Date(meal.date), 'MMM d, yyyy')}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span>{meal.quantity}g</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-1 rounded text-sm font-semibold bg-blue-50 text-blue-700">
                              {meal.calories} kcal
                            </span>
                            {meal.protein !== null && meal.protein !== undefined && (
                              <span className="px-2 py-1 rounded text-sm font-medium bg-green-50 text-green-700">
                                {meal.protein}g protein
                              </span>
                            )}
                            {meal.carbs !== null && meal.carbs !== undefined && (
                              <span className="px-2 py-1 rounded text-sm font-medium bg-amber-50 text-amber-700">
                                {meal.carbs}g carbs
                              </span>
                            )}
                            {meal.fat !== null && meal.fat !== undefined && (
                              <span className="px-2 py-1 rounded text-sm font-medium bg-red-50 text-red-700">
                                {meal.fat}g fat
                              </span>
                            )}
                          </div>
                          {meal.micronutrients && Object.keys(meal.micronutrients).length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="text-xs text-gray-600">
                                {Object.entries(meal.micronutrients)
                                  .slice(0, 3)
                                  .map(([key, value]) => {
                                    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim();
                                    const displayValue = typeof value === 'number' ? value.toFixed(1) : String(value || '');
                                    return (
                                      <span key={key} className="mr-3">
                                        {formattedKey}: {displayValue}
                                      </span>
                                    );
                                  })}
                                {Object.keys(meal.micronutrients).length > 3 && (
                                  <span className="text-gray-400">
                                    +{Object.keys(meal.micronutrients).length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
