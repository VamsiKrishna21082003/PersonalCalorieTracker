'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import WeeklyTrendChart from '@/components/charts/WeeklyTrendChart';
import MacroChart from '@/components/charts/MacroChart';
import GoalComparisonChart from '@/components/charts/GoalComparisonChart';
import MicronutrientChart from '@/components/charts/MicronutrientChart';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import InsightsPanel from '@/components/InsightsPanel';
import DashboardActions from '@/components/DashboardActions';
import ProgressBar from '@/components/ui/ProgressBar';
import api from '@/lib/api';

export default function DashboardPage() {
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [macroBreakdown, setMacroBreakdown] = useState<any>(null);
  const [micronutrientData, setMicronutrientData] = useState<any[]>([]);
  const [goalComparison, setGoalComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const normalizeMicronutrients = (input: unknown): Record<string, number> => {
        if (!input || typeof input !== 'object') {
          return {};
        }

        return Object.fromEntries(
          Object.entries(input as Record<string, unknown>).filter(
            ([, value]) => typeof value === 'number' && Number.isFinite(value)
          )
        ) as Record<string, number>;
      };

      const baseParams = new URLSearchParams({
        startDate: `${dateRange.startDate}T00:00:00Z`,
        endDate: `${dateRange.endDate}T23:59:59Z`,
      });

      // Fetch summary with groupBy parameter (always use 'day' for simplicity)
      const summaryParams = new URLSearchParams({
        startDate: `${dateRange.startDate}T00:00:00Z`,
        endDate: `${dateRange.endDate}T23:59:59Z`,
        groupBy: 'day',
      });

      const [summaryRes, macroRes, microRes, micronutrientRes, goalRes] = await Promise.all([
        api.get(`/api/reports/summary?${summaryParams.toString()}`).catch((err) => {
          console.error('Failed to fetch summary:', err);
          return { data: { data: [] } };
        }),
        api.get(`/api/reports/macros?${baseParams.toString()}`).catch((err) => {
          console.error('Failed to fetch macros:', err);
          return { data: {} };
        }),
        api.get(`/api/reports/micros?${baseParams.toString()}`).catch((err) => {
          console.error('Failed to fetch micros:', err);
          return { data: {} };
        }),
        api.get(`/api/reports/micronutrients?${summaryParams.toString()}`).catch((err) => {
          console.error('Failed to fetch micronutrients:', err);
          return { data: { data: [] } };
        }),
        api.get(`/api/reports/goal-comparison?${baseParams.toString()}`).catch((err) => {
          console.error('Failed to fetch goal comparison:', err);
          return { data: { hasGoal: false } };
        }),
      ]);

      // Transform summary data to match WeeklyTrendChart format
      // The API returns { data: [{ period, calories, protein, carbs, fat }] }
      const summaryData = summaryRes?.data?.data || [];
      const transformedTrend = Array.isArray(summaryData)
        ? summaryData.map((item: any) => {
            // Ensure period is a valid date string
            let dateStr = item.period;
            if (dateStr instanceof Date) {
              dateStr = dateStr.toISOString();
            } else if (typeof dateStr !== 'string') {
              dateStr = new Date(dateStr).toISOString();
            }
            return {
              date: dateStr,
              calories: Number(item.calories) || 0,
              protein: Number(item.protein) || 0,
              carbs: Number(item.carbs) || 0,
              fat: Number(item.fat) || 0,
            };
          })
        : [];

      setWeeklyTrend(transformedTrend);
      setMacroBreakdown(macroRes?.data || {});
      const summaryMicronutrients = normalizeMicronutrients(microRes?.data);

      // Prefer grouped micronutrient data from /micronutrients endpoint.
      // If empty/unavailable, fall back to the /micros summary or goal targets.
      let micronutrientDataArray = Array.isArray(micronutrientRes?.data?.data)
        ? micronutrientRes.data.data
        : [];

      if (micronutrientDataArray.length === 0 && Object.keys(summaryMicronutrients).length > 0) {
        micronutrientDataArray = [
          {
            period: `${dateRange.endDate}T00:00:00.000Z`,
            micronutrients: summaryMicronutrients,
          },
        ];
      }

      const goalMicronutrients = normalizeMicronutrients(goalRes?.data?.goal?.micronutrients);
      if (micronutrientDataArray.length === 0 && Object.keys(goalMicronutrients).length > 0) {
        micronutrientDataArray = [
          {
            period: `${dateRange.endDate}T00:00:00.000Z`,
            micronutrients: goalMicronutrients,
          },
        ];
      }

      setMicronutrientData(micronutrientDataArray);
      
      setGoalComparison(goalRes?.data || { hasGoal: false });

      // Log in development for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Dashboard data loaded:', {
          trendCount: transformedTrend.length,
          trendData: transformedTrend,
          hasMacros: !!macroRes?.data,
          macroData: macroRes?.data,
          hasMicros: Object.keys(summaryMicronutrients).length > 0,
          microData: summaryMicronutrients,
          micronutrientCount: micronutrientRes?.data?.data?.length || 0,
          micronutrientData: micronutrientDataArray,
          hasGoal: goalRes?.data?.hasGoal,
          dateRange,
          summaryResData: summaryRes?.data,
        });
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      // Set empty states on error
      setWeeklyTrend([]);
      setMacroBreakdown({});
      setMicronutrientData([]);
      setGoalComparison({ hasGoal: false });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  if (loading) {
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

  // Calculate summary stats from macro breakdown
  const summaryStats = macroBreakdown
    ? {
        calories: macroBreakdown.calories || 0,
        protein: macroBreakdown.protein || 0,
        carbs: macroBreakdown.carbs || 0,
        fat: macroBreakdown.fat || 0,
      }
    : { calories: 0, protein: 0, carbs: 0, fat: 0 };

  // Calculate goal percentages and trends
  const getGoalPercentage = (actual: number, goal: number) => {
    if (!goal || goal === 0) return null;
    return (actual / goal) * 100;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage > 110) return 'red';
    if (percentage < 90) return 'yellow';
    return 'green';
  };

  const getCalorieTrend = () => {
    if (weeklyTrend.length < 2) return null;
    const midPoint = Math.floor(weeklyTrend.length / 2);
    const firstHalf = weeklyTrend.slice(0, midPoint);
    const secondHalf = weeklyTrend.slice(midPoint);
    const firstAvg = firstHalf.reduce((sum, day) => sum + day.calories, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, day) => sum + day.calories, 0) / secondHalf.length;
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    return {
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      percentage: Math.abs(change),
    };
  };

  const calorieTrend = getCalorieTrend();

  return (
    <ProtectedRoute>
      <div className="flex-1 p-8 bg-gray-50">
        <div className="space-y-8">
          {/* Header with Actions */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
                <p className="text-sm text-gray-600">Track your nutrition and progress</p>
              </div>
              <DashboardActions
                summaryStats={summaryStats}
                weeklyTrend={weeklyTrend}
                goalComparison={goalComparison}
                macroBreakdown={macroBreakdown}
                dateRange={dateRange}
              />
            </div>

            {/* Date Range Filter */}
            <div className="flex gap-4 items-center flex-wrap">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Date Range:
              </label>
              <input
                type="date"
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm transition-colors"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm transition-colors"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
              />
            </div>
          </div>

          {/* Summary Stat Cards with Progress Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card hover>
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Calories</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {summaryStats.calories.toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    kcal
                    {goalComparison?.daysInRange && goalComparison.daysInRange > 1 && (
                      <span className="ml-1">({goalComparison.daysInRange} days)</span>
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              {goalComparison?.hasGoal && (
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">
                      Goal Progress
                      {goalComparison?.daysInRange && goalComparison.daysInRange > 1 && (
                        <span className="ml-1 text-gray-500">({goalComparison.daysInRange} days)</span>
                      )}
                    </span>
                    <span className={`text-xs font-medium ${
                      getGoalPercentage(summaryStats.calories, goalComparison.goal!.calories)! > 110
                        ? 'text-red-600'
                        : getGoalPercentage(summaryStats.calories, goalComparison.goal!.calories)! < 90
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}>
                      {getGoalPercentage(summaryStats.calories, goalComparison.goal!.calories)!.toFixed(0)}%
                      {goalComparison?.dailyGoal && (
                        <span className="ml-1 text-gray-500 font-normal">
                          ({goalComparison.dailyGoal.calories.toFixed(0)}/day)
                        </span>
                      )}
                    </span>
                  </div>
                  <ProgressBar
                    value={Math.min(100, getGoalPercentage(summaryStats.calories, goalComparison.goal!.calories)!)}
                    color={getProgressColor(getGoalPercentage(summaryStats.calories, goalComparison.goal!.calories)!)}
                  />
                </div>
              )}
              {calorieTrend && (
                <div className="mt-2 flex items-center gap-1">
                  <span className={`text-xs ${
                    calorieTrend.direction === 'up' ? 'text-red-600' :
                    calorieTrend.direction === 'down' ? 'text-green-600' :
                    'text-gray-500'
                  }`}>
                    {calorieTrend.direction === 'up' ? '↑' : calorieTrend.direction === 'down' ? '↓' : '→'} {calorieTrend.percentage.toFixed(1)}%
                  </span>
                </div>
              )}
            </Card>

            <Card hover>
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Protein</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {summaryStats.protein.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    grams
                    {goalComparison?.daysInRange && goalComparison.daysInRange > 1 && (
                      <span className="ml-1">({goalComparison.daysInRange} days)</span>
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              {goalComparison?.hasGoal && goalComparison.goal!.protein! > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">Goal Progress</span>
                    <span className={`text-xs font-medium ${
                      getGoalPercentage(summaryStats.protein, goalComparison.goal!.protein!)! > 110
                        ? 'text-red-600'
                        : getGoalPercentage(summaryStats.protein, goalComparison.goal!.protein!)! < 90
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}>
                      {getGoalPercentage(summaryStats.protein, goalComparison.goal!.protein!)!.toFixed(0)}%
                      {goalComparison?.dailyGoal && (
                        <span className="ml-1 text-gray-500 font-normal">
                          ({goalComparison.dailyGoal.protein.toFixed(0)}g/day)
                        </span>
                      )}
                    </span>
                  </div>
                  <ProgressBar
                    value={Math.min(100, getGoalPercentage(summaryStats.protein, goalComparison.goal!.protein!)!)}
                    color={getProgressColor(getGoalPercentage(summaryStats.protein, goalComparison.goal!.protein!)!)}
                  />
                </div>
              )}
            </Card>

            <Card hover>
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Carbs</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {summaryStats.carbs.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    grams
                    {goalComparison?.daysInRange && goalComparison.daysInRange > 1 && (
                      <span className="ml-1">({goalComparison.daysInRange} days)</span>
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              {goalComparison?.hasGoal && goalComparison.goal!.carbs! > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">Goal Progress</span>
                    <span className={`text-xs font-medium ${
                      getGoalPercentage(summaryStats.carbs, goalComparison.goal!.carbs!)! > 110
                        ? 'text-red-600'
                        : getGoalPercentage(summaryStats.carbs, goalComparison.goal!.carbs!)! < 90
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}>
                      {getGoalPercentage(summaryStats.carbs, goalComparison.goal!.carbs!)!.toFixed(0)}%
                      {goalComparison?.dailyGoal && (
                        <span className="ml-1 text-gray-500 font-normal">
                          ({goalComparison.dailyGoal.carbs.toFixed(0)}g/day)
                        </span>
                      )}
                    </span>
                  </div>
                  <ProgressBar
                    value={Math.min(100, getGoalPercentage(summaryStats.carbs, goalComparison.goal!.carbs!)!)}
                    color={getProgressColor(getGoalPercentage(summaryStats.carbs, goalComparison.goal!.carbs!)!)}
                  />
                </div>
              )}
            </Card>

            <Card hover>
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Fat</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {summaryStats.fat.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    grams
                    {goalComparison?.daysInRange && goalComparison.daysInRange > 1 && (
                      <span className="ml-1">({goalComparison.daysInRange} days)</span>
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
              {goalComparison?.hasGoal && goalComparison.goal!.fat! > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">Goal Progress</span>
                    <span className={`text-xs font-medium ${
                      getGoalPercentage(summaryStats.fat, goalComparison.goal!.fat!)! > 110
                        ? 'text-red-600'
                        : getGoalPercentage(summaryStats.fat, goalComparison.goal!.fat!)! < 90
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}>
                      {getGoalPercentage(summaryStats.fat, goalComparison.goal!.fat!)!.toFixed(0)}%
                      {goalComparison?.dailyGoal && (
                        <span className="ml-1 text-gray-500 font-normal">
                          ({goalComparison.dailyGoal.fat.toFixed(0)}g/day)
                        </span>
                      )}
                    </span>
                  </div>
                  <ProgressBar
                    value={Math.min(100, getGoalPercentage(summaryStats.fat, goalComparison.goal!.fat!)!)}
                    color={getProgressColor(getGoalPercentage(summaryStats.fat, goalComparison.goal!.fat!)!)}
                  />
                </div>
              )}
            </Card>
          </div>

          {/* Insights Panel */}
          <InsightsPanel
            goalComparison={goalComparison}
            weeklyTrend={weeklyTrend}
            macroBreakdown={macroBreakdown}
            dateRange={dateRange}
          />

          {/* Charts Grid */}
          <div className="grid grid-cols-1 gap-6">
            {/* Trend Chart */}
            <Card
              header={<h2 className="text-base font-semibold text-gray-900">Calorie Trend</h2>}
            >
              {weeklyTrend.length > 0 ? (
                <div className="pt-4">
                  <WeeklyTrendChart data={weeklyTrend} />
                </div>
              ) : (
                <EmptyState
                  title="No data available"
                  description="No calorie data available for the selected period. Try adjusting your date range."
                />
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Macro Breakdown */}
            <Card
              header={<h2 className="text-base font-semibold text-gray-900">Macro Breakdown</h2>}
            >
              {macroBreakdown ? (
                <div className="pt-4">
                  <MacroChart
                    protein={macroBreakdown.protein}
                    carbs={macroBreakdown.carbs}
                    fat={macroBreakdown.fat}
                    calories={macroBreakdown.calories}
                  />
                </div>
              ) : (
                <EmptyState
                  title="No macro data"
                  description="No macro nutrient data available for the selected period."
                />
              )}
            </Card>

            {/* Goal Comparison */}
            <Card
              header={<h2 className="text-base font-semibold text-gray-900">Goal vs Actual</h2>}
            >
              {goalComparison?.hasGoal ? (
                <div className="pt-4">
                  <GoalComparisonChart data={goalComparison} />
                  <div className="mt-6 space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Calories:</span>
                      <span className={`font-medium ${goalComparison.difference.calories >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {goalComparison.difference.calories > 0 ? '+' : ''}
                        {goalComparison.difference.calories.toFixed(0)} kcal
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Protein:</span>
                      <span className={`font-medium ${goalComparison.difference.protein > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {goalComparison.difference.protein > 0 ? '+' : ''}
                        {goalComparison.difference.protein.toFixed(1)}g
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Carbs:</span>
                      <span className={`font-medium ${goalComparison.difference.carbs > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {goalComparison.difference.carbs > 0 ? '+' : ''}
                        {goalComparison.difference.carbs.toFixed(1)}g
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Fat:</span>
                      <span className={`font-medium ${goalComparison.difference.fat > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {goalComparison.difference.fat > 0 ? '+' : ''}
                        {goalComparison.difference.fat.toFixed(1)}g
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No active goal"
                  description={goalComparison?.message || 'Set a goal to see comparison with your actual intake.'}
                />
              )}
            </Card>
          </div>

          {/* Micronutrient Summary Chart */}
          <Card
            header={<h2 className="text-base font-semibold text-gray-900">
              Micronutrient Summary
            </h2>}
          >
            {micronutrientData && Array.isArray(micronutrientData) && micronutrientData.length > 0 ? (
              <div className="pt-4">
                <MicronutrientChart data={micronutrientData} />
              </div>
            ) : (
              <EmptyState
                title="No micronutrient data"
                description="No micronutrient data available for the selected period. Add micronutrients when logging meals to see them here."
              />
            )}
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
