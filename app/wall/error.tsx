"use client"

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 p-6 text-center">
      <h2 className="text-xl font-semibold">Something went wrong loading the Wall</h2>
      <p className="text-muted-foreground text-sm max-w-prose">
        {error?.message || "An unexpected error occurred."}
      </p>
      <div className="flex gap-2 mt-2">
        <button className="px-3 py-1.5 border rounded" onClick={() => reset()}>Try again</button>
        <a className="px-3 py-1.5 border rounded" href="/">Go Home</a>
      </div>
    </div>
  )
}
