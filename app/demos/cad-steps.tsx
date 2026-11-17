import Image from "next/image";
import part from "../../public/demos/cad-steps/steps.json";
import "./cad-steps.css";

/* One sample of the dataset, 00079619, as the dataset holds it: the solid
   after each of its ten construction steps, five sketches each followed by
   the extrude that uses it. Amy wanted pictures rather than a 3D viewer
   (2026-11-16): a row of states reads as "how it gets built" at a glance.
   Each still is the real mesh scripts/make-cad-steps.py baked from the
   sample's STEP files (replayed in OpenCascade), captured from the 3D
   stepper this replaced (cad-stepper.tsx, in git history) at one fixed view
   and cropped to the same square so the part never jumps between them:
   public/software/cad-steps/step-<n>.webp. */

type Step = { name: string; kind: string; detail: string };

export default function CadSteps() {
  const steps = (part as { steps: Step[] }).steps;
  return (
    <figure className="ui-try cad-steps">
      <ol className="cad-steps-grid" aria-label="Sample 00079619, built step by step">
        {steps.map((s, i) => (
          <li key={s.name} className="cad-steps-cell">
            <div className="ui-media cad-steps-shot">
              <Image src={`/software/cad-steps/step-${i + 1}.webp`} alt={`After step ${i + 1}: ${s.kind.toLowerCase()}, ${s.detail}`} width={480} height={480} sizes="(min-width: 860px) 150px, 45vw" />
            </div>
            <p className="cad-steps-label">
              <span className="cad-steps-n">{i + 1}</span> <b>{s.kind}</b>
              <span className="cad-steps-detail">{s.detail}</span>
            </p>
          </li>
        ))}
      </ol>
      <figcaption className="ui-try-caption">Sample 00079619 from the dataset, every state it holds: each sketch, then the extrude that uses it. The finished part is step 10; the dataset keeps all ten.</figcaption>
    </figure>
  );
}
