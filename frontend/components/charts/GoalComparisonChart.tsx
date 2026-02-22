'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GoalComparisonData {
  goal: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    micronutrients?: Record<string, number>;
  };
  actual: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    micronutrients?: Record<string, number>;
  };
}

interface GoalComparisonChartProps {
  data: GoalComparisonData;
}

const formatMicronutrientName = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

export default function GoalComparisonChart({ data }: GoalComparisonChartProps) {
  const chartData = [
    {
      name: 'Calories',
      Goal: data.goal.calories,
      Actual: data.actual.calories,
    },
    {
      name: 'Protein (g)',
      Goal: data.goal.protein,
      Actual: data.actual.protein,
    },
    {
      name: 'Carbs (g)',
      Goal: data.goal.carbs,
      Actual: data.actual.carbs,
    },
    {
      name: 'Fat (g)',
      Goal: data.goal.fat,
      Actual: data.actual.fat,
    },
  ];

  // Add micronutrients if available
  const goalMicronutrients = data.goal.micronutrients || {};
  const actualMicronutrients = data.actual.micronutrients || {};
  const allMicronutrientKeys = new Set([
    ...Object.keys(goalMicronutrients),
    ...Object.keys(actualMicronutrients),
  ]);

  if (allMicronutrientKeys.size > 0) {
    allMicronutrientKeys.forEach((key) => {
      chartData.push({
        name: formatMicronutrientName(key),
        Goal: goalMicronutrients[key] || 0,
        Actual: actualMicronutrients[key] || 0,
      });
    });
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 60)}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" tick={{ fill: '#6b7280' }} />
        <YAxis type="category" dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} width={150} />
        <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827' }} />
        <Legend wrapperStyle={{ color: '#6b7280' }} />
        <Bar dataKey="Goal" fill="#2563eb" radius={[0, 8, 8, 0]} />
        <Bar dataKey="Actual" fill="#059669" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
