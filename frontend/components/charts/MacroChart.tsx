'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface MacroChartProps {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  goalComparison?: {
    hasGoal: boolean;
    goal?: { protein?: number; carbs?: number; fat?: number; micronutrients?: Record<string, number> };
    actual?: { protein?: number; carbs?: number; fat?: number; micronutrients?: Record<string, number> };
    difference?: { protein?: number; carbs?: number; fat?: number };
  };
  micronutrientData?: Record<string, number>;
}

const COLORS = ['#059669', '#d97706', '#dc2626'];

export default function MacroChart({ protein, carbs, fat, calories, goalComparison, micronutrientData }: MacroChartProps) {
  const data = [
    { name: 'Protein', value: protein, calories: protein * 4 },
    { name: 'Carbs', value: carbs, calories: carbs * 4 },
    { name: 'Fat', value: fat, calories: fat * 9 },
  ].filter((item) => item.value > 0);

  const renderLabel = (entry: any) => {
    const percentage = calories > 0 ? ((entry.calories / calories) * 100).toFixed(1) : '0';
    return `${entry.name}: ${percentage}%`;
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={95}
            fill="#8884d8"
            dataKey="calories"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#ffffff" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827' }}
            formatter={(value: number | undefined) => {
              if (value === undefined) return ['0 kcal', 'Calories'];
              return [`${value.toFixed(1)} kcal`, 'Calories'];
            }}
          />
          <Legend wrapperStyle={{ color: '#6b7280' }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">Protein:</span>
          <span className="font-medium text-gray-900">{protein.toFixed(1)}g</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">Carbs:</span>
          <span className="font-medium text-gray-900">{carbs.toFixed(1)}g</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">Fat:</span>
          <span className="font-medium text-gray-900">{fat.toFixed(1)}g</span>
        </div>
      </div>

      {/* Macro Insights Panel */}
      {calories > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Macro Insights</h3>
          <div className="space-y-2 text-sm">
            {/* Calculate percentages */}
            {(() => {
              const proteinCal = protein * 4;
              const carbsCal = carbs * 4;
              const fatCal = fat * 9;
              const proteinPct = calories > 0 ? (proteinCal / calories) * 100 : 0;
              const carbsPct = calories > 0 ? (carbsCal / calories) * 100 : 0;
              const fatPct = calories > 0 ? (fatCal / calories) * 100 : 0;

              const getStatus = (diff: number | undefined, goal: number | undefined) => {
                if (!goal || goal === 0 || diff === undefined) return null;
                const percentDiff = Math.abs((diff / goal) * 100);
                if (percentDiff <= 5) return { text: 'On Target', color: 'text-green-600' };
                if (percentDiff <= 10) return { text: 'Close', color: 'text-yellow-600' };
                return { text: diff > 0 ? 'Over Goal' : 'Under Goal', color: 'text-red-600' };
              };

              const improvements: string[] = [];
              
              if (goalComparison?.hasGoal && goalComparison.difference) {
                const diff = goalComparison.difference;
                const goal = goalComparison.goal;
                
                if (diff.protein !== undefined && goal?.protein && goal.protein > 0) {
                  if (diff.protein < -5) {
                    improvements.push(`Increase protein by ${Math.abs(diff.protein).toFixed(1)}g to meet your goal`);
                  } else if (diff.protein > 5) {
                    improvements.push(`Reduce protein by ${diff.protein.toFixed(1)}g to align with your goal`);
                  }
                }
                
                if (diff.carbs !== undefined && goal?.carbs && goal.carbs > 0) {
                  if (diff.carbs < -5) {
                    improvements.push(`Increase carbs by ${Math.abs(diff.carbs).toFixed(1)}g to meet your goal`);
                  } else if (diff.carbs > 5) {
                    improvements.push(`Reduce carbs by ${diff.carbs.toFixed(1)}g to align with your goal`);
                  }
                }
                
                if (diff.fat !== undefined && goal?.fat && goal.fat > 0) {
                  if (diff.fat < -5) {
                    improvements.push(`Increase fat by ${Math.abs(diff.fat).toFixed(1)}g to meet your goal`);
                  } else if (diff.fat > 5) {
                    improvements.push(`Reduce fat by ${diff.fat.toFixed(1)}g to align with your goal`);
                  }
                }
              }

              return (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Protein: {proteinPct.toFixed(1)}%</span>
                    {goalComparison?.hasGoal && goalComparison.difference?.protein !== undefined && goalComparison.goal?.protein && goalComparison.goal.protein > 0 ? (
                      <span className={`font-medium ${getStatus(goalComparison.difference.protein, goalComparison.goal.protein)?.color || 'text-gray-600'}`}>
                        {getStatus(goalComparison.difference.protein, goalComparison.goal.protein)?.text}
                        {goalComparison.difference.protein !== 0 && (
                          <span className="ml-1">
                            {goalComparison.difference.protein > 0 ? '+' : ''}
                            {goalComparison.difference.protein.toFixed(1)}g
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Carbs: {carbsPct.toFixed(1)}%</span>
                    {goalComparison?.hasGoal && goalComparison.difference?.carbs !== undefined && goalComparison.goal?.carbs && goalComparison.goal.carbs > 0 ? (
                      <span className={`font-medium ${getStatus(goalComparison.difference.carbs, goalComparison.goal.carbs)?.color || 'text-gray-600'}`}>
                        {getStatus(goalComparison.difference.carbs, goalComparison.goal.carbs)?.text}
                        {goalComparison.difference.carbs !== 0 && (
                          <span className="ml-1">
                            {goalComparison.difference.carbs > 0 ? '+' : ''}
                            {goalComparison.difference.carbs.toFixed(1)}g
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Fat: {fatPct.toFixed(1)}%</span>
                    {goalComparison?.hasGoal && goalComparison.difference?.fat !== undefined && goalComparison.goal?.fat && goalComparison.goal.fat > 0 ? (
                      <span className={`font-medium ${getStatus(goalComparison.difference.fat, goalComparison.goal.fat)?.color || 'text-gray-600'}`}>
                        {getStatus(goalComparison.difference.fat, goalComparison.goal.fat)?.text}
                        {goalComparison.difference.fat !== 0 && (
                          <span className="ml-1">
                            {goalComparison.difference.fat > 0 ? '+' : ''}
                            {goalComparison.difference.fat.toFixed(1)}g
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                  {improvements.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500">💡</span>
                        <div className="flex-1 space-y-1">
                          {improvements.map((improvement, idx) => (
                            <p key={idx} className="text-gray-700 leading-relaxed">{improvement}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Micro Insights Panel */}
      {micronutrientData && Object.keys(micronutrientData).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Micro Insights</h3>
          <div className="space-y-2 text-sm">
            {(() => {
              // Priority order for micronutrients
              const priorityOrder = ['iron', 'calcium', 'vitaminD', 'vitaminC', 'vitaminA', 'vitaminE', 'vitaminK', 'magnesium', 'zinc', 'potassium', 'sodium', 'phosphorus'];
              
              // Get micronutrients that have data or goals
              const goalMicronutrients = goalComparison?.goal?.micronutrients || {};
              const actualMicronutrients = goalComparison?.actual?.micronutrients || {};
              const allMicronutrientKeys = new Set([
                ...Object.keys(micronutrientData),
                ...Object.keys(goalMicronutrients),
              ]);

              // Sort by priority, then by availability
              const sortedKeys = [
                ...priorityOrder.filter(key => allMicronutrientKeys.has(key)),
                ...Array.from(allMicronutrientKeys).filter(key => !priorityOrder.includes(key)).sort(),
              ].slice(0, 5); // Show max 5 micronutrients

              const getUnit = (key: string): string => {
                if (key === 'vitaminD') return 'IU';
                if (key === 'vitaminA' || key === 'vitaminK') return 'mcg';
                return 'mg';
              };

              const formatName = (key: string): string => {
                return key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, (str) => str.toUpperCase())
                  .trim();
              };

              const getStatus = (actual: number | undefined, goal: number | undefined) => {
                if (!goal || goal === 0 || actual === undefined) return null;
                const diff = actual - goal;
                const percentDiff = Math.abs((diff / goal) * 100);
                if (percentDiff <= 5) return { text: 'On Target', color: 'text-green-600', diff };
                if (percentDiff <= 10) return { text: 'Close', color: 'text-yellow-600', diff };
                return { text: diff > 0 ? 'Over Goal' : 'Under Goal', color: 'text-red-600', diff };
              };

              const microImprovements: string[] = [];

              sortedKeys.forEach((key) => {
                const actual = actualMicronutrients[key] || micronutrientData[key] || 0;
                const goal = goalMicronutrients[key];
                const status = getStatus(actual, goal);
                
                if (goal && status && Math.abs(status.diff) > (goal * 0.05)) {
                  const unit = getUnit(key);
                  const diff = status.diff;
                  if (diff < 0) {
                    microImprovements.push(`Increase ${formatName(key)} by ${Math.abs(diff).toFixed(1)}${unit} to meet your goal`);
                  } else if (diff > 0) {
                    microImprovements.push(`Reduce ${formatName(key)} by ${diff.toFixed(1)}${unit} to align with your goal`);
                  }
                }
              });

              return (
                <>
                  {sortedKeys.map((key) => {
                    const actual = actualMicronutrients[key] || micronutrientData[key] || 0;
                    const goal = goalMicronutrients[key];
                    const status = getStatus(actual, goal);
                    const unit = getUnit(key);
                    const displayValue = actual > 0 ? actual : (goal || 0);

                    if (displayValue === 0 && !goal) return null;

                    return (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-gray-600">
                          {formatName(key)}: {displayValue.toFixed(1)}{unit}
                        </span>
                        {status ? (
                          <span className={`font-medium ${status.color}`}>
                            {status.text}
                            {status.diff !== 0 && (
                              <span className="ml-1">
                                {status.diff > 0 ? '+' : ''}
                                {status.diff.toFixed(1)}{unit}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    );
                  })}
                  {microImprovements.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500">💡</span>
                        <div className="flex-1 space-y-1">
                          {microImprovements.map((improvement, idx) => (
                            <p key={idx} className="text-gray-700 leading-relaxed">{improvement}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
