import Image from "next/image";

export function Hero() {
  return (
    <section className="min-h-[80vh] flex flex-col items-center justify-center px-6 pt-12">
      <div className="animate-fade-up">
        <Image
          src="/pretzel.png"
          alt="pretzel"
          width={40}
          height={40}
          className="mx-auto mb-8 hover:rotate-12 transition-transform duration-500"
        />
      </div>
      <h1 className="text-5xl md:text-7xl font-bold tracking-[-0.04em] mb-4 animate-fade-up delay-100">
        amy zhou
      </h1>
      <p className="text-base md:text-lg text-[var(--color-muted)] tracking-wide animate-fade-up delay-200">
        design engineer
        <span className="animate-blink ml-0.5 text-neutral-400">|</span>
      </p>
      {/* subtle scroll hint */}
      <div className="mt-16 animate-fade-up delay-400">
        <div className="w-px h-8 bg-gradient-to-b from-transparent to-neutral-300 mx-auto" />
      </div>
    </section>
  );
}
