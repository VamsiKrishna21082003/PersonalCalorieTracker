'use client';

export type GroupByOption = 'day' | 'week';

interface GroupByToggleProps {
  value: GroupByOption;
  onChange: (value: GroupByOption) => void;
  className?: string;
}

export default function GroupByToggle({ value, onChange, className = '' }: GroupByToggleProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
        Group By:
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as GroupByOption)}
        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm transition-colors bg-white px-3 py-1.5 min-w-[120px]"
      >
        <option value="day">Daily</option>
        <option value="week">Weekly</option>
      </select>
    </div>
  );
}
