'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface WeightData {
  date: string;
  weight: number;
}

interface WeightTrendChartProps {
  data: WeightData[];
}

export default function WeightTrendChart({ data }: WeightTrendChartProps) {
  const formatDate = (value: string) => {
    const date = new Date(value);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatTooltipLabel = (value: string) => {
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
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
        <YAxis 
          tick={{ fill: '#6b7280' }}
          label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827' }}
          labelFormatter={formatTooltipLabel}
          formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Weight']}
        />
        <Line 
          type="monotone" 
          dataKey="weight" 
          stroke="#2563eb" 
          strokeWidth={2} 
          name="Weight (kg)" 
          dot={{ fill: '#2563eb', r: 4 }} 
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
