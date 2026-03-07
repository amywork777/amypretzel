import Image from "next/image";
import Link from "next/link";

export default function PortfolioPage() {
  return (
    <div className="bg-aero h-screen flex flex-col overflow-hidden">
      {/* top bar */}
      <div className="shrink-0 p-3 md:p-4">
        <div className="window-frame rounded-lg px-4 py-2.5 flex items-center justify-between max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/pretzel.png"
              alt="pretzel"
              width={20}
              height={20}
              className="group-hover:rotate-12 transition-transform duration-300 drop-shadow-sm"
              style={{ imageRendering: "pixelated" }}
            />
            <span className="font-pixel text-[11px] font-bold text-[#7a5a8a] tracking-wider">
              amy zhou
            </span>
          </Link>
          <Link
            href="/"
            className="btn-glossy px-4 py-1.5 text-[10px] font-bold text-[#8a6080] tracking-wide"
          >
            back home
          </Link>
        </div>
      </div>

      {/* iframe */}
      <div className="flex-1 px-3 md:px-4 pb-3 md:pb-4 min-h-0">
        <div className="window-frame rounded-lg overflow-hidden flex flex-col h-full max-w-6xl mx-auto">
          {/* window chrome */}
          <div className="window-titlebar shrink-0 flex items-center gap-3 px-4 py-2">
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full border border-white/40" style={{ background: "#f0b0b8" }} />
              <div className="w-3 h-3 rounded-full border border-white/40" style={{ background: "#f0dca0" }} />
              <div className="w-3 h-3 rounded-full border border-white/40" style={{ background: "#a8e0b8" }} />
            </div>
            <div className="flex-1 px-2 py-1 border-2 border-[#e0c0d0] border-t-[#c8a0b8] border-l-[#c8a0b8] border-r-[#fff] border-b-[#fff] bg-white rounded">
              <span className="font-pixel text-[10px] text-[#c0a0b0]">
                notion.site / portfolio
              </span>
            </div>
          </div>

          {/* iframe with cover bar */}
          <div className="relative flex-1 min-h-0">
            <div className="absolute top-0 left-0 right-0 h-12 bg-white z-10" />
            <iframe
              src="https://delightful-may-f04.notion.site/ebd/23bfc3fa1d2a801eaa57cf367b68b68d"
              className="absolute inset-0 w-full h-full border-0"
              loading="lazy"
              title="Amy Zhou Portfolio"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
