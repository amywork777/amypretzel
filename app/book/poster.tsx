export default function BookPoster({ hidden = false }: { hidden?: boolean }) {
  return <picture className={`book-poster${hidden ? " book-poster-hidden" : ""}`}>
    <source media="(max-aspect-ratio: 9/10)" srcSet="/book/scene-mobile.webp" />
    {/* The already-sized scene should paint without an image-optimizer request. */}
    <img src="/book/scene-desktop.webp" alt="" fetchPriority="high" decoding="async" />
  </picture>;
}
