'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GoalComparisonData {
  goal: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  actual: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface GoalComparisonChartProps {
  data: GoalComparisonData;
}

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

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
        <YAxis tick={{ fill: '#6b7280' }} />
        <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827' }} />
        <Legend wrapperStyle={{ color: '#6b7280' }} />
        <Bar dataKey="Goal" fill="#2563eb" radius={[8, 8, 0, 0]} />
        <Bar dataKey="Actual" fill="#059669" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
