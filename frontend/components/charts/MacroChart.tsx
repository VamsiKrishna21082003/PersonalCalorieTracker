'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface MacroChartProps {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

const COLORS = ['#059669', '#d97706', '#dc2626'];

export default function MacroChart({ protein, carbs, fat, calories }: MacroChartProps) {
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
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={80}
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
  );
}
