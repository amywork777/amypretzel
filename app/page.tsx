import Image from "next/image";
import Bubbles from "./bubbles";
import Timeline from "./timeline";
import ClickHearts from "./click-hearts";

export default function Home() {
  return (
    <div className="bg-aero h-screen flex flex-col overflow-hidden relative">
      <ClickHearts />
      {/* === DECORATIVE BG === */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {/* clouds */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/graphics/cloud1.png" alt="" width={220} height={130}
          className="absolute top-[2%] left-[0%] animate-drift opacity-90" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/graphics/cloud2.png" alt="" width={180} height={76}
          className="absolute top-[1%] right-[3%] animate-drift opacity-85" style={{ animationDelay: "3s" }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/graphics/cloud3.png" alt="" width={140} height={83}
          className="absolute top-[8%] left-[32%] animate-drift opacity-65" style={{ animationDelay: "7s" }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/graphics/cloud4.png" alt="" width={160} height={68}
          className="absolute top-[5%] right-[25%] animate-drift opacity-70" style={{ animationDelay: "5s" }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/graphics/cloud5.png" alt="" width={120} height={71}
          className="absolute top-[14%] left-[15%] animate-drift opacity-55" style={{ animationDelay: "9s" }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/graphics/cloud1.png" alt="" width={100} height={59}
          className="absolute top-[12%] right-[12%] animate-drift opacity-50" style={{ animationDelay: "11s" }} />

        {/* interactive bubbles */}
        <Bubbles />

        {/* sparkles */}
        <div className="absolute top-[8%] left-[28%] w-3 h-3 bg-white rounded-full animate-sparkle opacity-70" style={{ boxShadow: "0 0 12px 4px rgba(255,255,255,0.6)" }} />
        <div className="absolute top-[30%] right-[10%] w-2.5 h-2.5 bg-white rounded-full animate-sparkle opacity-50" style={{ boxShadow: "0 0 10px 3px rgba(255,255,255,0.5)", animationDelay: "1s" }} />
        <div className="absolute bottom-[15%] left-[15%] w-2 h-2 bg-white rounded-full animate-sparkle opacity-45" style={{ boxShadow: "0 0 8px 3px rgba(255,255,255,0.4)", animationDelay: "2s" }} />
        <div className="absolute top-[18%] right-[25%] w-1.5 h-1.5 bg-white rounded-full animate-sparkle opacity-40" style={{ boxShadow: "0 0 8px 2px rgba(255,255,255,0.3)", animationDelay: "1.5s" }} />
        <div className="absolute top-[45%] left-[10%] w-2 h-2 bg-white rounded-full animate-sparkle opacity-35" style={{ boxShadow: "0 0 10px 3px rgba(255,255,255,0.3)", animationDelay: "0.7s" }} />

        {/* sea creatures */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/graphics/jellyfish.png" alt="" width={80} height={80}
          className="absolute bottom-[6%] left-[4%] animate-jelly opacity-40" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/graphics/fish.png" alt="" width={55} height={55}
          className="absolute bottom-[14%] right-[6%] animate-fish-right opacity-35" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/graphics/bluefish.png" alt="" width={60} height={42}
          className="absolute bottom-[22%] left-[10%] animate-fish-left opacity-30" style={{ animationDelay: "3s" }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/graphics/goldfish.png" alt="" width={55} height={37}
          className="absolute bottom-[10%] right-[25%] animate-fish-dart opacity-35" style={{ animationDelay: "5s" }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/graphics/yellowtang.png" alt="" width={55} height={30}
          className="absolute bottom-[18%] left-[30%] animate-fish-right opacity-30" style={{ animationDelay: "7s" }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/graphics/angelfish.png" alt="" width={60} height={33}
          className="absolute bottom-[4%] right-[12%] animate-fish-left opacity-32" style={{ animationDelay: "2s" }} />
      </div>

      {/* === COMPUTER WINDOW === */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-2 sm:p-4 md:p-8">
        <div className="w-full max-w-2xl h-full max-h-[95vh] sm:max-h-[90vh] flex flex-col window-frame rounded-lg overflow-hidden animate-scale-in">

          {/* title bar */}
          <div className="window-titlebar shrink-0 flex items-center gap-2 px-3 py-1.5">
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full border border-white/40" style={{ background: "#f0b0b8" }} />
              <div className="w-3 h-3 rounded-full border border-white/40" style={{ background: "#f0dca0" }} />
              <div className="w-3 h-3 rounded-full border border-white/40" style={{ background: "#a8e0b8" }} />
            </div>
            <div className="flex-1 flex items-center justify-center gap-2">
              <Image src="/pretzel.png" alt="pretzel" width={14} height={14} style={{ imageRendering: "pixelated" }} />
              <span className="font-pixel text-[11px] font-bold text-[#8a6080] tracking-wider">amypretzel.com</span>
            </div>
            <div className="w-[42px]" />
          </div>

          {/* address bar */}
          <div className="shrink-0 px-3 py-1.5 bg-[#f0e0ea] border-b-2 border-[#e0c0d0]">
            <div className="px-2 py-1 border-2 border-[#e0c0d0] border-t-[#c8a0b8] border-l-[#c8a0b8] border-r-[#fff] border-b-[#fff] bg-white rounded">
              <span className="font-pixel text-[10px] text-[#c0a0b0]">amypretzel.com</span>
            </div>
          </div>

          {/* scrollable content area */}
          <div className="flex-1 overflow-y-auto bg-[#faf5f8] window-content">
            <div className="p-4 sm:p-5 md:p-7 max-w-lg mx-auto">

              {/* hero */}
              <div className="text-center mb-6">
                <div className="inline-block mb-3">
                  <Image src="/pretzel.png" alt="pretzel" width={48} height={48}
                    className="drop-shadow-md hover:rotate-12 transition-transform cursor-pointer" style={{ imageRendering: "pixelated" }} />
                </div>
                <h1 className="font-pixel text-xl md:text-2xl font-bold tracking-wide text-[#7a5a8a] mb-1">
                  amy zhou
                </h1>
              </div>

              {/* nav */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
                <a href="#about" className="sticker-btn btn-glossy px-3 sm:px-4 py-1.5 text-[10px] font-bold text-[#8a6080] tracking-wide">about</a>
                <a href="/portfolio" className="sticker-btn btn-glossy px-3 sm:px-4 py-1.5 text-[10px] font-bold text-[#8a6080] tracking-wide">portfolio</a>
                <a href="#links" className="sticker-btn btn-glossy px-3 sm:px-4 py-1.5 text-[10px] font-bold text-[#8a6080] tracking-wide">links</a>
                <a href="#connect" className="sticker-btn btn-glossy px-3 sm:px-4 py-1.5 text-[10px] font-bold text-[#8a6080] tracking-wide">connect</a>
              </div>

              {/* about me */}
              <div id="about">
                <h2 className="font-pixel text-[13px] font-bold text-[#7a5a8a] mb-3">&#x2729; about me</h2>
                <div className="text-[13px] leading-relaxed text-[#6a5a70] space-y-2.5 mb-8">
                  <p>hi, i&apos;m amy zhou. i am an engineer and designer who loves taking ideas and turning them into real products.</p>
                  <p>right now, i&apos;m a product design engineer at <strong className="text-[#7a5a8a]">vizcom</strong>, where i&apos;m building AI tools that help designers go from idea to reality faster. think concept sketches turning into production-ready visuals in seconds.</p>
                  <p>before that, i built <strong className="text-[#7a5a8a]">taiyaki</strong>, an AI assisted concept to CAD system, <strong className="text-[#7a5a8a]">taya</strong>, a wearable AI journal designed as jewelry, a custom AI jewelry pipeline that turned sketches into physical pieces, and <strong className="text-[#7a5a8a]">mobius</strong>, a company focused on bringing more transparency and efficiency to materials trading and recycling.</p>
                  <p>i studied product design and mechanical engineering at <strong className="text-[#7a5a8a]">stanford</strong>, with a minor in music. i also worked at <strong className="text-[#7a5a8a]">apple</strong> as a product design engineer, focusing on hardware that was useful, durable, and better for the environment.</p>
                  <p>i live in san francisco and spend my time learning, building, and exploring new ideas. i care about thoughtful design, clear engineering, and making things that feel personal and meaningful.</p>
                  <p className="text-[#b8a0b0]">i always enjoy meeting new people and having good conversations, so feel free to reach out.</p>
                </div>
              </div>

              {/* divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 border-t-2 border-[#e8d0e0] border-b border-b-white" />
                <span className="font-pixel text-[10px] text-[#e0b8d0]">&hearts;</span>
                <div className="flex-1 border-t-2 border-[#e8d0e0] border-b border-b-white" />
              </div>

              {/* connect */}
              <div id="connect" className="mb-8">
                <h2 className="font-pixel text-[13px] font-bold text-[#7a5a8a] mb-3">&#x2709; connect</h2>
                <div className="space-y-1.5">
                  <a href="mailto:amzyst@gmail.com" className="flex items-baseline gap-2 px-3 py-2 rounded-lg hover:bg-[#f0e0ea] transition-colors group">
                    <span className="text-[12px] font-bold text-[#b080a0] group-hover:text-[#8a5a7a] shrink-0">email</span>
                    <span className="text-[11px] text-[#c0a8b8]">amzyst@gmail.com</span>
                  </a>
                  <a href="https://x.com/amypretzel" target="_blank" rel="noopener noreferrer" className="flex items-baseline gap-2 px-3 py-2 rounded-lg hover:bg-[#f0e0ea] transition-colors group">
                    <span className="text-[12px] font-bold text-[#b080a0] group-hover:text-[#8a5a7a] shrink-0">x</span>
                    <span className="text-[11px] text-[#c0a8b8]">@amypretzel</span>
                  </a>
                  <a href="https://linkedin.com/in/amy7" target="_blank" rel="noopener noreferrer" className="flex items-baseline gap-2 px-3 py-2 rounded-lg hover:bg-[#f0e0ea] transition-colors group">
                    <span className="text-[12px] font-bold text-[#b080a0] group-hover:text-[#8a5a7a] shrink-0">linkedin</span>
                    <span className="text-[11px] text-[#c0a8b8]">linkedin.com/in/amy7</span>
                  </a>
                  <a href="https://github.com/amywork777" target="_blank" rel="noopener noreferrer" className="flex items-baseline gap-2 px-3 py-2 rounded-lg hover:bg-[#f0e0ea] transition-colors group">
                    <span className="text-[12px] font-bold text-[#b080a0] group-hover:text-[#8a5a7a] shrink-0">github</span>
                    <span className="text-[11px] text-[#c0a8b8]">github.com/amywork777</span>
                  </a>
                </div>
              </div>

              {/* divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 border-t-2 border-[#e8d0e0] border-b border-b-white" />
                <span className="font-pixel text-[10px] text-[#e0b8d0]">&hearts;</span>
                <div className="flex-1 border-t-2 border-[#e8d0e0] border-b border-b-white" />
              </div>

              {/* links */}
              <div id="links" className="mb-8">
                <h2 className="font-pixel text-[13px] font-bold text-[#7a5a8a] mb-1">&#x2605; links &amp; stuff</h2>
                <p className="text-[10px] text-[#c0a8b8] mb-3">things i find useful or cool</p>
                <div className="space-y-1.5">
                  {[
                    { name: "makercase", url: "https://www.makercase.com/", desc: "quick box generator for laser cutting" },
                    { name: "protolabs guide", url: "https://www.protolabs.com/", desc: "actually useful injection molding reference" },
                    { name: "thingiverse", url: "https://www.thingiverse.com/", desc: "go-to for quick inspiration or parts" },
                    { name: "jlcpcb cnc", url: "https://jlcpcb.com/", desc: "cheap, decent quality fast protos" },
                    { name: "tinkercad", url: "https://www.tinkercad.com/", desc: "fast rough CAD without the overhead" },
                    { name: "convert3d.org", url: "https://convert3d.org/", desc: "lifesaver for cursed file formats" },
                    { name: "phosphor icons", url: "https://phosphoricons.com/", desc: "clean flexible icon set" },
                    { name: "hugging face", url: "https://huggingface.co/", desc: "where the useful AI stuff lives" },
                  ].map((l) => (
                    <a key={l.name} href={l.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-baseline gap-2 px-3 py-2 rounded-lg hover:bg-[#f0e0ea] transition-colors group">
                      <span className="text-[12px] font-bold text-[#b080a0] group-hover:text-[#8a5a7a] shrink-0">{l.name}</span>
                      <span className="text-[10px] text-[#d0b8c8] truncate">{l.desc}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 border-t-2 border-[#e8d0e0] border-b border-b-white" />
                <span className="font-pixel text-[10px] text-[#e0b8d0]">&hearts;</span>
                <div className="flex-1 border-t-2 border-[#e8d0e0] border-b border-b-white" />
              </div>

              {/* timeline — collapsible */}
              <div className="mb-8">
                <Timeline />
              </div>

              <p className="text-center text-[9px] text-[#d0b8c8] mt-4 pb-2">&copy; 2026 amy zhou</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
