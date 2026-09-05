import Link from "next/link";
import { softwareSections } from "./projects";

export default function SoftwareProjectList() {
  return <>{softwareSections.map(section => (
    <div className="software-group" key={section.title}>
      <h3>{section.title}</h3>
      <div>{section.projects.map(project => (
        <Link key={project.slug} href={`/software/${project.slug}`} className="software-row">
          <h4>{project.title}</h4>
          <p>{project.summary}</p>
        </Link>
      ))}</div>
    </div>
  ))}</>;
}
