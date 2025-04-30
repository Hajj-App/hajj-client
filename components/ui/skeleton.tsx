import { View } from 'react-native';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <View
      className={cn(
        'bg-gray-200 animate-pulse rounded-md',
        className
      )}
    />
  );
} 