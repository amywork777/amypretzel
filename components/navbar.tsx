"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const navLinks = [
  { label: "portfolio", href: "#portfolio" },
  { label: "about", href: "#about" },
  { label: "links", href: "#links" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300 ${
        scrolled ? "shadow-[0_1px_0_0_#e0e0e0]" : ""
      }`}
    >
      <div className="max-w-3xl mx-auto px-6 h-12 flex items-center justify-between">
        {/* logo + name */}
        <a
          href="#"
          className="flex items-center gap-2.5 group"
        >
          <Image
            src="/pretzel.png"
            alt="pretzel logo"
            width={20}
            height={20}
            className="group-hover:rotate-12 transition-transform duration-300"
          />
          <span className="text-xs tracking-wide">amy zhou</span>
        </a>

        {/* desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs tracking-wide text-neutral-500 hover:text-black transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* mobile hamburger */}
        <button
          className="md:hidden p-2 -mr-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="toggle menu"
        >
          <div className="w-4 flex flex-col gap-[3px]">
            <span
              className={`block h-px bg-black transition-all duration-300 ${
                menuOpen ? "rotate-45 translate-y-[4px]" : ""
              }`}
            />
            <span
              className={`block h-px bg-black transition-all duration-300 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-px bg-black transition-all duration-300 ${
                menuOpen ? "-rotate-45 -translate-y-[4px]" : ""
              }`}
            />
          </div>
        </button>
      </div>

      {/* mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          menuOpen ? "max-h-48 border-t border-[var(--color-rule)]" : "max-h-0"
        }`}
      >
        <div className="max-w-3xl mx-auto px-6 py-5 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs tracking-wide text-neutral-500 hover:text-black transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
