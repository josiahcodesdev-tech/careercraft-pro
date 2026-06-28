import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  gradient: string;
  description?: string;
}

export function StatCard({ title, value, icon: Icon, gradient, description }: StatCardProps) {
  return (
    <div className={`rounded-2xl p-6 text-white ${gradient} relative overflow-hidden`}>
      <div className="absolute top-4 right-4 opacity-20">
        <Icon className="w-12 h-12" />
      </div>
      <p className="text-sm font-medium text-white/80 mb-1">{title}</p>
      <p className="text-3xl font-heading font-black">
        {value.toLocaleString()}
      </p>
      {description && (
        <p className="text-xs text-white/60 mt-1">{description}</p>
      )}
    </div>
  );
}
