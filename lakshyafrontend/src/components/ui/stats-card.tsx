import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string | {
    value: number;
    isPositive: boolean;
  };
  color?: 'indigo' | 'green' | 'blue' | 'yellow' | 'red' | 'purple';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend, color = 'indigo' }) => {
  const colorClasses = {
    indigo: 'text-indigo-600 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-500/15',
    green: 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-500/15',
    blue: 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-500/15',
    yellow: 'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-500/15',
    red: 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-500/15',
    purple: 'text-purple-600 bg-purple-100 dark:text-purple-300 dark:bg-purple-500/15',
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">{value}</p>
          {trend && (
            typeof trend === 'string' ? (
              <p className="text-sm mt-2 text-green-600">{trend}</p>
            ) : (
              <p className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}%
                <span className="ml-1 text-gray-500 dark:text-slate-400">vs last month</span>
              </p>
            )
          )}
        </div>
        {icon && (
          <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
