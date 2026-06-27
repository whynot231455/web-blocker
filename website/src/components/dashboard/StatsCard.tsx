import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
}

const borderColorMap: Record<string, string> = {
  blue: 'border-blue-300',
  green: 'border-green-300',
  purple: 'border-purple-300',
  orange: 'border-orange-300',
};

const bgColorMap: Record<string, string> = {
  blue: 'bg-blue-50',
  green: 'bg-green-50',
  purple: 'bg-purple-50',
  orange: 'bg-orange-50',
};

const iconColorMap: Record<string, string> = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  purple: 'text-purple-600',
  orange: 'text-orange-600',
};

export const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend,
  color = 'blue'
}) => {
  return (
    <div className="border-2 border-black bg-white p-5 shadow-[6px_6px_0px_#000]">
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
            {title}
          </p>
          <h3 className="text-2xl font-black text-gray-900 mt-1 tracking-tighter">
            {value}
          </h3>
          
          {(description || trend) && (
            <div className="flex items-center mt-2 text-[10px] font-bold uppercase tracking-widest">
              {trend && (
                <span className={`font-black mr-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.isPositive ? '↑' : '↓'} {trend.value}%
                </span>
              )}
              {description && <span className="text-gray-500">{description}</span>}
            </div>
          )}
        </div>
        <div className={`shrink-0 border-2 ${borderColorMap[color]} ${bgColorMap[color]} p-2.5 shadow-[3px_3px_0px_#000]`}>
          <Icon size={20} className={iconColorMap[color]} />
        </div>
      </div>
    </div>
  );
};
