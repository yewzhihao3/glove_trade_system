import React from 'react';

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  isLoading?: boolean;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, description, children, isLoading = false }) => {
  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 flex flex-col h-full shadow-xl">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
      </div>
      <div className="flex-1 relative min-h-[300px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default ChartCard;
