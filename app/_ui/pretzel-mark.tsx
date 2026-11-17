/* Amy's pretzel as a sketch: one rope looped into two round lobes, crossing
   in an X (the strand that passes under is broken where it does), the two
   ends resting on the belly. It replaced the purple clay pretzel and the pink
   sprinkled one on 2026-11-16, when Amy asked for only sketch icons, no
   coloured things. Drawn in ink (currentColor) with a fixed 2px-ish line at
   any size, and it boils through the taste kit's filter (#taste-boil, mounted
   once in the root layout). Same hand as the homepage group marks. */
export function PretzelMark({ className, weight = 2.2 }: { className?: string; weight?: number }) {
  return (
    <svg className={className} viewBox="0 0 100 80" fill="none" stroke="currentColor" strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ filter: "url(#taste-boil)" }}>
      <path vectorEffect="non-scaling-stroke" d="M26 70.5C33.5 61 44 51.5 50 44.5 56 37.5 56.5 30 60 22.5 64.5 12.5 73.5 8 82 10c11 2.6 15.5 15 11.5 27-4 12.5-17.5 23-31.5 29-8 3.4-16 3.4-24 0C24.5 60 11 49.5 7 37 3 25 7.5 12.6 18 10c8.5-2 17.5 2.5 22 12.5 3 6.6 3.6 11.5 6.3 16.4" />
      <path vectorEffect="non-scaling-stroke" d="M53.7 48.6c5.6 6.6 12.6 13.4 20.3 21.9" />
    </svg>
  );
}
