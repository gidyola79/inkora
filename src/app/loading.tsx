import { SkeletonGrid } from "@/components/skeleton";

export default function Loading() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-10 h-10 w-2/3 animate-pulse rounded-lg bg-border sm:w-1/2" />
      <SkeletonGrid count={6} />
    </section>
  );
}