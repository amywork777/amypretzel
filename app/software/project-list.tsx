import { Row, RowGroup } from "../_ui/items";
import { softwareSections } from "./projects";

export default function SoftwareProjectList() {
  return <>{softwareSections.map(section => (
    <RowGroup key={section.title} title={section.title}>
      {section.projects.map(project => (
        <Row key={project.slug} href={`/software/${project.slug}`} title={project.title} text={project.summary} as="h4" />
      ))}
    </RowGroup>
  ))}</>;
}
