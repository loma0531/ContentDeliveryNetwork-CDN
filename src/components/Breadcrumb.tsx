'use client';

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  path: string; // Use path for navigation
  name: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onItemClick: (index: number) => void;
  // Add onMoveItem prop
  onMoveItem: (sourcePath: string, targetPath: string) => Promise<void>;
}

export function Breadcrumb({ items, onItemClick, onMoveItem }: BreadcrumbProps) {
  // State to track drag over for visual feedback
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
    e.stopPropagation(); // Prevent event from bubbling up
    setDragOverIndex(index); // Set index for visual feedback
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up
    setDragOverIndex(null); // Remove visual feedback
  };

  const handleDrop = (e: React.DragEvent, targetItem: BreadcrumbItem) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling up
    setDragOverIndex(null); // Remove visual feedback

    const sourcePath = e.dataTransfer.getData('text/plain');
    const targetPath = targetItem.path;

    if (sourcePath) {
      console.log(`Dropped ${sourcePath} onto breadcrumb ${targetPath}`);
      onMoveItem(sourcePath, targetPath);
    }
  };

  return (
    <nav aria-label="breadcrumb" className="flex items-center space-x-1 text-sm text-muted-foreground">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={item.path || 'root'}>
            <span
              className={cn(
                'transition-colors',
                !isLast && 'hover:text-foreground cursor-pointer',
                // Add class for drag over feedback
                dragOverIndex === index && 'text-primary border-b border-primary'
              )}
              onClick={() => !isLast && onItemClick(index)}
              // Add drag and drop handlers
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, item)}
            >
              {item.name}
            </span>
            {!isLast && <ChevronRight className="h-4 w-4" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
