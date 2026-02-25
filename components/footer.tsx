import Image from "next/image";

export function Footer() {
  return (
    <footer className="py-12">
      <div className="max-w-4xl mx-auto px-6">
        <hr className="border-gray-200 mb-6" />
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <span>© 2026 amy zhou</span>
          <Image src="/pretzel.png" alt="pretzel" width={14} height={14} />
        </div>
      </div>
    </footer>
  );
}
