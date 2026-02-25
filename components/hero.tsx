import Image from "next/image";

export function Hero() {
  return (
    <section className="min-h-[70vh] flex flex-col items-center justify-center px-6 pt-14">
      <Image
        src="/pretzel.png"
        alt="pretzel"
        width={48}
        height={48}
        className="mb-6 hover:rotate-12 transition-transform duration-300"
      />
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-3">
        amy zhou
      </h1>
      <p className="text-lg md:text-xl text-gray-600">
        design engineer
        <span className="animate-blink ml-0.5">|</span>
      </p>
    </section>
  );
}
