export default function Loading() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse h-48 sm:h-80 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  )
}
