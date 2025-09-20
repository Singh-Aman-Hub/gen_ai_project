import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('container mx-auto px-4', className)}>
      {children}
    </div>
  );
}

export default PageContainer;


