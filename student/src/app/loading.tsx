export default function Loading() {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-1/3 rounded-xl bg-surfaceLight" />
        <div className="h-40 rounded-3xl bg-surfaceLight" />
        <div className="h-40 rounded-3xl bg-surfaceLight" />
      </div>
    </div>
  );
}
