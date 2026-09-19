import Link from "next/link";
import { softwareSections } from "./projects";

export default function SoftwareProjectList() {
  return <>{softwareSections.map(section => (
    <section className="index-group" key={section.title} aria-label={section.title}>
      <h2>{section.title}</h2>
      <ul className="index-list">{section.projects.map(project => (
        <li key={project.slug}>
          <Link href={`/software/${project.slug}`} className="index-row">
            <span className="text-display index-title">{project.title}</span>
            <span className="index-meta">{project.meta}</span>
          </Link>
        </li>
      ))}</ul>
    </section>
  ))}</>;
}
