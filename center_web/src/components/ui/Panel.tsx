import React from 'react';
import { cn } from '@/lib/utils'; // Assurez-vous d'avoir configuré tailwind-merge

type PanelProps = {
  children: React.ReactNode;
  className?: string;
};

const Panel = ({ children, className }: PanelProps) => {
  return (
    <div
      className={cn('bg-white border border-gray-200 rounded-lg shadow-sm', className)}
    >
      {children}
    </div>
  );
};

export default Panel;