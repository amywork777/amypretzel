/* MDX → React component map for editorial article styling */
import type { MDXComponents } from "mdx/types";

export const mdxComponents: MDXComponents = {
  h1: (props) => (
    <h1
      {...props}
      className="font-display italic text-[30px] sm:text-[44px] leading-[1.05] text-ink mt-10 sm:mt-12 mb-4 sm:mb-5"
    />
  ),
  h2: (props) => (
    <h2
      {...props}
      className="font-display italic text-[24px] sm:text-[36px] leading-[1.1] text-ink mt-10 sm:mt-12 mb-3 sm:mb-4"
    />
  ),
  h3: (props) => (
    <h3
      {...props}
      className="font-display italic text-[20px] sm:text-[28px] leading-[1.15] text-ink mt-8 sm:mt-10 mb-3"
    />
  ),
  p: (props) => (
    <p
      {...props}
      className="text-[16px] sm:text-[17px] leading-[1.65] sm:leading-[1.7] text-ink-soft mb-4 sm:mb-5 last:mb-0"
    />
  ),
  ul: (props) => (
    <ul
      {...props}
      className="space-y-1.5 sm:space-y-2 text-[16px] sm:text-[17px] leading-[1.65] sm:leading-[1.7] text-ink-soft my-5 sm:my-6 list-disc pl-5 sm:pl-6 marker:text-ink-faint"
    />
  ),
  ol: (props) => (
    <ol
      {...props}
      className="space-y-1.5 sm:space-y-2 text-[16px] sm:text-[17px] leading-[1.65] sm:leading-[1.7] text-ink-soft my-5 sm:my-6 list-decimal pl-5 sm:pl-6 marker:text-ink-faint"
    />
  ),
  li: (props) => <li {...props} />,
  strong: (props) => <strong {...props} className="text-ink font-semibold" />,
  em: (props) => <em {...props} className="italic" />,
  a: (props) => (
    <a
      {...props}
      target={props.href?.startsWith("http") ? "_blank" : undefined}
      rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
      className="link text-ink"
    />
  ),
  blockquote: (props) => (
    <blockquote
      {...props}
      className="border-l-2 border-accent pl-4 sm:pl-5 my-5 sm:my-6 text-[16px] sm:text-[17px] leading-[1.65] sm:leading-[1.7] text-ink italic"
    />
  ),
  hr: () => <hr className="my-10 border-0 h-px bg-rule" />,
  code: (props) => (
    <code
      {...props}
      className="font-mono text-[14px] bg-card-deep px-1.5 py-0.5 rounded text-ink"
    />
  ),
  pre: (props) => (
    <pre
      {...props}
      className="font-mono text-[14px] bg-card-deep p-4 rounded my-6 overflow-x-auto leading-[1.55] text-ink"
    />
  ),
};
