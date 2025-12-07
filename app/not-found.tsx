import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 text-center">
      <div className="space-y-6">
        <div className="flex justify-center text-6xl">🧐</div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Nothing to see here
          </h1>
          <p className="max-w-xs text-slate-500 sm:max-w-sm">
            The page you're looking for seems to have gone on its own little
            trip.
          </p>
        </div>
        <Button asChild size="lg" className="rounded-full">
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </div>
  );
}
