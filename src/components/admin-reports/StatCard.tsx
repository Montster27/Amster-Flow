import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  trend?: {
    value: number;
    label: string;
  };
}

const colorClasses = {
  blue: 'border-l-blue-500 bg-blue-50',
  green: 'border-l-green-500 bg-green-50',
  yellow: 'border-l-yellow-500 bg-yellow-50',
  red: 'border-l-red-500 bg-red-50',
  purple: 'border-l-purple-500 bg-purple-50',
  gray: 'border-l-gray-500 bg-gray-50',
};

const textColorClasses = {
  blue: 'text-blue-900',
  green: 'text-green-900',
  yellow: 'text-yellow-900',
  red: 'text-red-900',
  purple: 'text-purple-900',
  gray: 'text-gray-900',
};

const subtitleColorClasses = {
  blue: 'text-blue-700',
  green: 'text-green-700',
  yellow: 'text-yellow-700',
  red: 'text-red-700',
  purple: 'text-purple-700',
  gray: 'text-gray-700',
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  trend,
}: StatCardProps) {
  return (
    <div
      className={`rounded-lg p-4 border-l-4 ${colorClasses[color]} transition-shadow hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${subtitleColorClasses[color]}`}>{title}</p>
          <p className={`mt-1 text-3xl font-bold ${textColorClasses[color]}`}>
            {typeof value === 'number' && !Number.isInteger(value)
              ? value.toFixed(1)
              : value}
          </p>
          {subtitle && (
            <p className={`mt-1 text-xs ${subtitleColorClasses[color]}`}>{subtitle}</p>
          )}
          {trend && (
            <p className="mt-1 text-xs">
              <span
                className={
                  trend.value >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }
              >
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-gray-500 ml-1">{trend.label}</span>
            </p>
          )}
        </div>
        {icon && (
          <div className={`${subtitleColorClasses[color]} opacity-75`}>{icon}</div>
        )}
      </div>
    </div>
  );
}

interface ProgressStatCardProps {
  title: string;
  items: Array<{
    label: string;
    value: number;
    color: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  }>;
  total?: number;
}

const barColorClasses = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  gray: 'bg-gray-400',
};

export function ProgressStatCard({ title, items, total }: ProgressStatCardProps) {
  const computedTotal = total ?? items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      <p className="text-sm font-medium text-gray-700 mb-3">{title}</p>
      <div className="space-y-2">
        {items.map((item, index) => {
          const percentage = computedTotal > 0 ? (item.value / computedTotal) * 100 : 0;
          return (
            <div key={index}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">{item.label}</span>
                <span className="text-gray-900 font-medium">
                  {item.value} ({percentage.toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${barColorClasses[item.color]}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
