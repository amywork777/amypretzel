import { Silkscreen } from "next/font/google";

const pixel = Silkscreen({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-pixel" });

export default function FishingLayout({ children }: { children: React.ReactNode }) {
  return <div className={pixel.variable}>{children}</div>;
}
