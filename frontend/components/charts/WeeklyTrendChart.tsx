'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface WeeklyTrendData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface WeeklyTrendChartProps {
  data: WeeklyTrendData[];
  groupBy?: 'day' | 'week';
}

export default function WeeklyTrendChart({ data, groupBy }: WeeklyTrendChartProps) {
  const formatDate = (value: string) => {
    const date = new Date(value);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatTooltipLabel = (label: React.ReactNode) => {
    if (typeof label === 'string') {
      const date = new Date(label);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return label;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#6b7280' }}
          tickFormatter={formatDate}
        />
        <YAxis tick={{ fill: '#6b7280' }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827' }}
          labelFormatter={formatTooltipLabel}
        />
        <Legend wrapperStyle={{ color: '#6b7280' }} />
        <Line type="monotone" dataKey="calories" stroke="#2563eb" strokeWidth={2} name="Calories (kcal)" dot={{ fill: '#2563eb', r: 3 }} />
        <Line type="monotone" dataKey="protein" stroke="#059669" strokeWidth={2} name="Protein (g)" dot={{ fill: '#059669', r: 3 }} />
        <Line type="monotone" dataKey="carbs" stroke="#d97706" strokeWidth={2} name="Carbs (g)" dot={{ fill: '#d97706', r: 3 }} />
        <Line type="monotone" dataKey="fat" stroke="#dc2626" strokeWidth={2} name="Fat (g)" dot={{ fill: '#dc2626', r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
