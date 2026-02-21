'use client';

interface ProgressBarProps {
  value: number; // 0-100
  color?: 'green' | 'yellow' | 'red' | 'blue';
  className?: string;
  showLabel?: boolean;
}

export default function ProgressBar({ 
  value, 
  color = 'blue', 
  className = '',
  showLabel = false 
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  
  const colorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600">Progress</span>
          <span className="text-xs font-medium text-gray-900">{clampedValue.toFixed(0)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`${colorClasses[color]} h-2 rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
