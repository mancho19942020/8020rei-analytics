'use client';

interface ScorecardProps {
  label: string;
  value: number;
  icon: string;
  color?: string;
}

export function Scorecard({ label, value, icon, color = 'bg-main-500' }: ScorecardProps) {
  return (
    <div className="bg-surface-raised rounded-lg border border-stroke p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-label text-content-secondary font-medium">{label}</span>
        <span className={`w-10 h-10 rounded-md ${color} flex items-center justify-center text-xl shadow-xs`}>
          {icon}
        </span>
      </div>
      <div className="text-h1 text-content-primary font-semibold">
        {value?.toLocaleString() ?? 0}
      </div>
    </div>
  );
}
