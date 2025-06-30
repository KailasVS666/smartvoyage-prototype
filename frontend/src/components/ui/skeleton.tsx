import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

export function Skeleton({
  className,
  shimmer = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-white/5 animate-pulse",
        shimmer && "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export function HotelCardSkeleton() {
  return (
    <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-6 shadow-md shadow-white/10 animate-fade-in">
      <Skeleton className="w-full aspect-[3/2] rounded-xl mb-4" />
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <div className="flex flex-wrap gap-2 mb-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-6 w-20 rounded-full" />
        ))}
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

export function ReviewSkeleton() {
  return (
    <div className="border border-gray-700 rounded p-2 bg-gray-900">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

export function HotelDetailsSkeleton() {
  return (
    <div className="animate-fade-in space-y-4">
      <Skeleton className="w-full h-64 rounded-lg mb-4" />
      <Skeleton className="h-8 w-3/4 mb-2" />
      <Skeleton className="h-6 w-1/4 mb-2" />
      <Skeleton className="h-6 w-1/2 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-6 w-1/3 mb-2" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ItineraryGeneratorSkeleton() {
  return (
    <div className="animate-fade-in space-y-6 max-w-2xl mx-auto p-6">
      {/* Form skeleton */}
      <div className="bg-white/5 rounded-xl p-6 mb-6">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
        <Skeleton className="h-10 w-full mb-2" />
        <Skeleton className="h-10 w-full mb-2" />
        <Skeleton className="h-10 w-1/3" />
      </div>
      {/* Itinerary days skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/5 rounded-lg p-4">
            <Skeleton className="h-6 w-1/4 mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
