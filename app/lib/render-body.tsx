import type React from "react";

/* very lightweight markdown-ish renderer:
   - lines starting with `## ` become h2
   - lines starting with `### ` become h3
   - lines starting with `- ` become list items (consecutive ones group)
   - **bold** becomes <strong>
   - blank-line-separated paragraphs otherwise
*/
export function renderBody(body: string) {
  const blocks: React.ReactNode[] = [];
  const paras = body.split(/\n\s*\n/);

  paras.forEach((block, bi) => {
    const lines = block.split("\n");

    // bullet list
    if (lines.every((l) => l.trim().startsWith("- "))) {
      blocks.push(
        <ul key={bi} className="space-y-2 text-[16px] sm:text-[17px] leading-[1.65] text-ink-soft my-5 list-disc pl-5 marker:text-ink-faint">
          {lines.map((l, i) => (
            <li key={i}>{renderInline(l.replace(/^-\s+/, ""))}</li>
          ))}
        </ul>
      );
      return;
    }

    // h2 / h3
    if (lines.length === 1) {
      const t = lines[0].trim();
      if (t.startsWith("### ")) {
        blocks.push(
          <h3 key={bi} className="font-display italic text-[24px] sm:text-[28px] leading-[1.1] text-ink mt-10 mb-3">
            {t.slice(4)}
          </h3>
        );
        return;
      }
      if (t.startsWith("## ")) {
        blocks.push(
          <h2 key={bi} className="font-display italic text-[32px] sm:text-[40px] leading-[1.05] text-ink mt-14 mb-4">
            {t.slice(3)}
          </h2>
        );
        return;
      }
    }

    // paragraph (joined with line breaks)
    blocks.push(
      <p key={bi} className="text-[16px] sm:text-[17px] leading-[1.7] text-ink-soft mb-4">
        {renderInline(lines.join(" "))}
      </p>
    );
  });

  return blocks;
}

/* inline **bold** */
export function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="text-ink font-semibold">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}
