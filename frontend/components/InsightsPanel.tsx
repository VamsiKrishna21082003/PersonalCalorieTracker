'use client';

import Card from './ui/Card';
import Badge from './ui/Badge';

interface GoalComparison {
  hasGoal: boolean;
  goal?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  actual?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  difference?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface WeeklyTrend {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MacroBreakdown {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  percentages?: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface InsightsPanelProps {
  goalComparison: GoalComparison | null;
  weeklyTrend: WeeklyTrend[];
  macroBreakdown: MacroBreakdown | null;
  dateRange: { startDate: string; endDate: string };
}

export default function InsightsPanel({
  goalComparison,
  weeklyTrend,
  macroBreakdown,
  dateRange,
}: InsightsPanelProps) {
  // Calculate goal insights
  const goalInsights = goalComparison?.hasGoal
    ? {
        calories: {
          percentage: (goalComparison.actual!.calories / goalComparison.goal!.calories) * 100,
          status: goalComparison.actual!.calories > goalComparison.goal!.calories * 1.1 ? 'exceeded' : 
                  goalComparison.actual!.calories < goalComparison.goal!.calories * 0.9 ? 'under' : 'on-track',
        },
        protein: {
          percentage: goalComparison.goal!.protein > 0 
            ? (goalComparison.actual!.protein / goalComparison.goal!.protein) * 100 
            : 0,
          status: goalComparison.goal!.protein > 0 && goalComparison.actual!.protein > goalComparison.goal!.protein * 1.1 ? 'exceeded' : 
                  goalComparison.goal!.protein > 0 && goalComparison.actual!.protein < goalComparison.goal!.protein * 0.9 ? 'under' : 'on-track',
        },
        carbs: {
          percentage: goalComparison.goal!.carbs > 0 
            ? (goalComparison.actual!.carbs / goalComparison.goal!.carbs) * 100 
            : 0,
          status: goalComparison.goal!.carbs > 0 && goalComparison.actual!.carbs > goalComparison.goal!.carbs * 1.1 ? 'exceeded' : 
                  goalComparison.goal!.carbs > 0 && goalComparison.actual!.carbs < goalComparison.goal!.carbs * 0.9 ? 'under' : 'on-track',
        },
        fat: {
          percentage: goalComparison.goal!.fat > 0 
            ? (goalComparison.actual!.fat / goalComparison.goal!.fat) * 100 
            : 0,
          status: goalComparison.goal!.fat > 0 && goalComparison.actual!.fat > goalComparison.goal!.fat * 1.1 ? 'exceeded' : 
                  goalComparison.goal!.fat > 0 && goalComparison.actual!.fat < goalComparison.goal!.fat * 0.9 ? 'under' : 'on-track',
        },
      }
    : null;

  // Calculate macro balance insights
  const macroBalance = macroBreakdown?.percentages
    ? {
        protein: {
          percentage: macroBreakdown.percentages.protein,
          status: macroBreakdown.percentages.protein < 20 ? 'low' : 
                  macroBreakdown.percentages.protein > 30 ? 'high' : 'optimal',
        },
        carbs: {
          percentage: macroBreakdown.percentages.carbs,
          status: macroBreakdown.percentages.carbs < 45 ? 'low' : 
                  macroBreakdown.percentages.carbs > 65 ? 'high' : 'optimal',
        },
        fat: {
          percentage: macroBreakdown.percentages.fat,
          status: macroBreakdown.percentages.fat < 20 ? 'low' : 
                  macroBreakdown.percentages.fat > 35 ? 'high' : 'optimal',
        },
      }
    : null;

  // Calculate calorie trend
  const calorieTrend = weeklyTrend.length > 1
    ? (() => {
        const midPoint = Math.floor(weeklyTrend.length / 2);
        const firstHalf = weeklyTrend.slice(0, midPoint);
        const secondHalf = weeklyTrend.slice(midPoint);
        
        const firstAvg = firstHalf.reduce((sum, day) => sum + day.calories, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, day) => sum + day.calories, 0) / secondHalf.length;
        
        const change = ((secondAvg - firstAvg) / firstAvg) * 100;
        const overallAvg = weeklyTrend.reduce((sum, day) => sum + day.calories, 0) / weeklyTrend.length;
        
        return {
          direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
          percentage: Math.abs(change),
          average: overallAvg,
        };
      })()
    : null;

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'exceeded':
      case 'high':
        return 'error';
      case 'under':
      case 'low':
        return 'warning';
      case 'on-track':
      case 'optimal':
      case 'stable':
        return 'success';
      default:
        return 'info';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'exceeded':
      case 'high':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        );
      case 'under':
      case 'low':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
      case 'on-track':
      case 'optimal':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'stable':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <Card
      header={<h2 className="text-base font-semibold text-gray-900">Insights</h2>}
    >
      <div className="space-y-6">
        {/* Two Column Grid for Goal Status and Macro Balance */}
        {(goalInsights || macroBalance) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Goal Status */}
            {goalInsights && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Goal Status</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Calories</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {goalInsights.calories.percentage.toFixed(0)}%
                      </span>
                      <Badge variant={getStatusBadgeVariant(goalInsights.calories.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(goalInsights.calories.status)}
                          <span className="capitalize">{goalInsights.calories.status.replace('-', ' ')}</span>
                        </div>
                      </Badge>
                    </div>
                  </div>
                  {goalComparison?.goal!.protein! > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Protein</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {goalInsights.protein.percentage.toFixed(0)}%
                        </span>
                        <Badge variant={getStatusBadgeVariant(goalInsights.protein.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(goalInsights.protein.status)}
                            <span className="capitalize">{goalInsights.protein.status.replace('-', ' ')}</span>
                          </div>
                        </Badge>
                      </div>
                    </div>
                  )}
                  {goalComparison?.goal!.carbs! > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Carbs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {goalInsights.carbs.percentage.toFixed(0)}%
                        </span>
                        <Badge variant={getStatusBadgeVariant(goalInsights.carbs.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(goalInsights.carbs.status)}
                            <span className="capitalize">{goalInsights.carbs.status.replace('-', ' ')}</span>
                          </div>
                        </Badge>
                      </div>
                    </div>
                  )}
                  {goalComparison?.goal!.fat! > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Fat</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {goalInsights.fat.percentage.toFixed(0)}%
                        </span>
                        <Badge variant={getStatusBadgeVariant(goalInsights.fat.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(goalInsights.fat.status)}
                            <span className="capitalize">{goalInsights.fat.status.replace('-', ' ')}</span>
                          </div>
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Macro Balance */}
            {macroBalance && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Macro Balance</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Protein</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {macroBalance.protein.percentage.toFixed(1)}%
                      </span>
                      <Badge variant={getStatusBadgeVariant(macroBalance.protein.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(macroBalance.protein.status)}
                          <span className="capitalize">{macroBalance.protein.status}</span>
                        </div>
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Carbs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {macroBalance.carbs.percentage.toFixed(1)}%
                      </span>
                      <Badge variant={getStatusBadgeVariant(macroBalance.carbs.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(macroBalance.carbs.status)}
                          <span className="capitalize">{macroBalance.carbs.status}</span>
                        </div>
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Fat</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {macroBalance.fat.percentage.toFixed(1)}%
                      </span>
                      <Badge variant={getStatusBadgeVariant(macroBalance.fat.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(macroBalance.fat.status)}
                          <span className="capitalize">{macroBalance.fat.status}</span>
                        </div>
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trend - Full Width */}
        {calorieTrend && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Calorie Trend</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Trend Direction</span>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(calorieTrend.direction)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(calorieTrend.direction)}
                      <span className="capitalize">{calorieTrend.direction}</span>
                    </div>
                  </Badge>
                  <span className="text-sm font-medium text-gray-900">
                    {calorieTrend.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Period Average</span>
                <span className="text-sm font-medium text-gray-900">
                  {calorieTrend.average.toFixed(0)} kcal
                </span>
              </div>
            </div>
          </div>
        )}

        {!goalInsights && !macroBalance && !calorieTrend && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No insights available. Add meals and set goals to see insights.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
