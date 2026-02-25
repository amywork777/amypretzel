import Image from "next/image";

export function Footer() {
  return (
    <footer className="py-16 pb-12">
      <div className="max-w-3xl mx-auto px-6">
        <hr className="border-[var(--color-rule)] mb-8" />
        <div className="flex items-center justify-center gap-2 text-[10px] tracking-[0.15em] text-neutral-400">
          <span>© 2026 amy zhou</span>
          <Image
            src="/pretzel.png"
            alt="pretzel"
            width={12}
            height={12}
            className="opacity-40"
          />
        </div>
      </div>
    </footer>
  );
}
