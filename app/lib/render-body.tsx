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
        <ul key={bi}>
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
          <h3 key={bi}>
            {t.slice(4)}
          </h3>
        );
        return;
      }
      if (t.startsWith("## ")) {
        blocks.push(
          <h2 key={bi}>
            {t.slice(3)}
          </h2>
        );
        return;
      }
    }

    // paragraph (joined with line breaks)
    blocks.push(
      <p key={bi}>
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
      <strong key={i}>
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}
