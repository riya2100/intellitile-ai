import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col space-y-3">
          <Skeleton className="h-[250px] w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
          <div className="flex justify-between pt-4">
            <Skeleton className="h-8 w-[80px]" />
            <Skeleton className="h-8 w-[80px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PulseLoading() {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 bg-primary/20 rounded-full animate-ping absolute inset-0"></div>
        <div className="w-16 h-16 bg-primary/40 rounded-full animate-pulse relative z-10 flex items-center justify-center">
          <div className="w-8 h-8 bg-primary rounded-full"></div>
        </div>
      </div>
      <p className="text-muted-foreground font-medium animate-pulse text-lg">AI is generating your vision...</p>
    </div>
  );
}