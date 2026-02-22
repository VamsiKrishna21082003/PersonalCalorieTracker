'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MicronutrientData {
  period: string;
  micronutrients: Record<string, number>;
}

interface MicronutrientChartProps {
  data: MicronutrientData[];
  groupBy?: 'day' | 'week';
}

// Common micronutrients to display with colors
const MICRONUTRIENT_COLORS: Record<string, string> = {
  vitaminA: '#f59e0b', // Amber
  vitaminC: '#10b981', // Green
  iron: '#ef4444', // Red
  calcium: '#3b82f6', // Blue
  vitaminD: '#f97316', // Orange
  vitaminE: '#eab308', // Yellow
  vitaminK: '#8b5cf6', // Purple
  magnesium: '#06b6d4', // Cyan
  zinc: '#84cc16', // Lime
  potassium: '#ec4899', // Pink
  sodium: '#6366f1', // Indigo
  phosphorus: '#14b8a6', // Teal
};

// Format micronutrient name for display
const formatMicronutrientName = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

export default function MicronutrientChart({ data, groupBy }: MicronutrientChartProps) {
  // Get all unique micronutrient keys from the data
  const allMicronutrientKeys = new Set<string>();
  data.forEach((item) => {
    Object.keys(item.micronutrients).forEach((key) => allMicronutrientKeys.add(key));
  });

  // Sort keys to prioritize common ones, then alphabetically
  const commonKeys = ['vitaminA', 'vitaminC', 'iron', 'calcium', 'vitaminD', 'vitaminE', 'vitaminK', 'magnesium', 'zinc', 'potassium', 'sodium', 'phosphorus'];
  const sortedKeys = [
    ...commonKeys.filter((key) => allMicronutrientKeys.has(key)),
    ...Array.from(allMicronutrientKeys).filter((key) => !commonKeys.includes(key)).sort(),
  ];

  // Transform data for chart
  const chartData = data.map((item) => {
    const chartItem: any = {
      period: item.period,
    };
    sortedKeys.forEach((key) => {
      chartItem[key] = item.micronutrients[key] || 0;
    });
    return chartItem;
  });

  const formatDate = (value: string) => {
    const date = new Date(value);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatTooltipLabel = (value: string) => {
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (sortedKeys.length === 0 || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        <p className="text-sm">No micronutrient data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="period"
          tick={{ fill: '#6b7280', fontSize: 12 }}
          tickFormatter={formatDate}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          tick={{ fill: '#6b7280' }}
          label={{ value: 'Amount', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827' }}
          labelFormatter={formatTooltipLabel}
          formatter={(value: number, name: string) => {
            const formattedName = formatMicronutrientName(name);
            return [`${value.toFixed(2)}`, formattedName];
          }}
        />
        <Legend 
          wrapperStyle={{ color: '#6b7280', paddingTop: '20px' }}
          formatter={(value: string) => formatMicronutrientName(value)}
        />
        {sortedKeys.map((key) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="micronutrients"
            fill={MICRONUTRIENT_COLORS[key] || '#9ca3af'}
            name={key}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
