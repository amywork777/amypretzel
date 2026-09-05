import Image from "next/image";
import Link from "next/link";

type Project = { title: string; caption: string; cover: string; href: string };

export default function ProjectGrid({ projects, kind = "object" }: { projects: Project[]; kind?: "object" | "software" }) {
  return <div className="selected-grid">
    {projects.map(project => (
      <Link key={project.href} href={project.href} className="selected-project">
        <div className={`selected-image ${kind === "software" ? "software-image" : ""}`}>
          <Image src={project.cover} alt={project.title} fill sizes="(max-width: 540px) 45vw, 411px" />
        </div>
        <div className="project-caption"><h3>{project.title}</h3><p>{project.caption}</p></div>
      </Link>
    ))}
  </div>;
}
