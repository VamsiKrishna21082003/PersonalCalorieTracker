'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import GoalForm from '@/components/GoalForm';
import Card from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import api from '@/lib/api';
import { format } from 'date-fns';

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
  createdAt: string;
  micronutrients?: any;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const fetchGoals = async () => {
    try {
      const [goalsRes, currentRes] = await Promise.all([
        api.get('/api/goals'),
        api.get('/api/goals/current').catch(() => null),
      ]);
      setGoals(goalsRes.data);
      setCurrentGoal(currentRes?.data || null);
      
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('Goals fetched:', {
          goals: goalsRes.data,
          currentGoal: currentRes?.data,
          hasMicronutrients: currentRes?.data?.micronutrients ? Object.keys(currentRes.data.micronutrients).length : 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleSuccess = () => {
    setShowForm(false);
    setEditingGoal(null);
    fetchGoals();
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <Container maxWidth="4xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Goals</h1>
              <Button
                onClick={() => {
                  setEditingGoal(null);
                  setShowForm(!showForm);
                }}
              >
                {showForm ? 'Cancel' : 'New Goal'}
              </Button>
            </div>
            <p className="text-base text-gray-600">Set and manage your nutrition goals</p>
          </div>

          {/* Form Card */}
          {showForm && (
            <Card className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </h2>
              <GoalForm key={editingGoal?.id || 'new-goal'} goal={editingGoal} onSuccess={handleSuccess} />
            </Card>
          )}

          {/* Current Active Goal Card */}
          {currentGoal && (
            <Card className="mb-6" hover>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-lg font-semibold text-gray-900">Current Active Goal</h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {format(new Date(currentGoal.startDate), 'MMM d, yyyy')}
                    {currentGoal.endDate && ` - ${format(new Date(currentGoal.endDate), 'MMM d, yyyy')}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingGoal(currentGoal);
                    setShowForm(true);
                  }}
                >
                  Edit
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-200">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Calories</p>
                  <p className="text-xl font-semibold text-gray-900">{currentGoal.dailyCalories}</p>
                  <p className="text-xs text-gray-500 mt-0.5">kcal/day</p>
                </div>
                {currentGoal.dailyProtein && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Protein</p>
                    <p className="text-xl font-semibold text-gray-900">{currentGoal.dailyProtein}</p>
                    <p className="text-xs text-gray-500 mt-0.5">grams</p>
                  </div>
                )}
                {currentGoal.dailyCarbs && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Carbs</p>
                    <p className="text-xl font-semibold text-gray-900">{currentGoal.dailyCarbs}</p>
                    <p className="text-xs text-gray-500 mt-0.5">grams</p>
                  </div>
                )}
                {currentGoal.dailyFat && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Fat</p>
                    <p className="text-xl font-semibold text-gray-900">{currentGoal.dailyFat}</p>
                    <p className="text-xs text-gray-500 mt-0.5">grams</p>
                  </div>
                )}
                {currentGoal.weightGoal && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Weight Goal</p>
                    <p className="text-xl font-semibold text-gray-900">{currentGoal.weightGoal}</p>
                    <p className="text-xs text-gray-500 mt-0.5">kg</p>
                  </div>
                )}
              </div>
              {currentGoal.micronutrients && Object.keys(currentGoal.micronutrients).length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">Micronutrient Goals</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.entries(currentGoal.micronutrients).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim()}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">{value as number}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* All Goals Section */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">All Goals</h2>
            {goals.length === 0 ? (
              <EmptyState
                title="No goals found"
                description="Create your first nutrition goal to start tracking your progress."
                action={{
                  label: 'Create Goal',
                  onClick: () => setShowForm(true),
                }}
              />
            ) : (
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="p-6 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {goal.dailyCalories} kcal/day
                          </h3>
                          {goal.isActive && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          {format(new Date(goal.startDate), 'MMM d, yyyy')}
                          {goal.endDate && ` - ${format(new Date(goal.endDate), 'MMM d, yyyy')}`}
                        </p>
                        {(goal.dailyProtein || goal.dailyCarbs || goal.dailyFat || goal.weightGoal) && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                            {goal.dailyProtein && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Protein</p>
                                <p className="text-sm font-semibold text-gray-900">{goal.dailyProtein}g</p>
                              </div>
                            )}
                            {goal.dailyCarbs && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Carbs</p>
                                <p className="text-sm font-semibold text-gray-900">{goal.dailyCarbs}g</p>
                              </div>
                            )}
                            {goal.dailyFat && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Fat</p>
                                <p className="text-sm font-semibold text-gray-900">{goal.dailyFat}g</p>
                              </div>
                            )}
                            {goal.weightGoal && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Weight Goal</p>
                                <p className="text-sm font-semibold text-gray-900">{goal.weightGoal}kg</p>
                              </div>
                            )}
                          </div>
                        )}
                        {goal.micronutrients && Object.keys(goal.micronutrients).length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Micronutrient Goals</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {Object.entries(goal.micronutrients).map(([key, value]) => (
                                <div key={key}>
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim()}
                                  </p>
                                  <p className="text-sm font-semibold text-gray-900">{value as number}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingGoal(goal);
                          setShowForm(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Container>
      </div>
    </ProtectedRoute>
  );
}
