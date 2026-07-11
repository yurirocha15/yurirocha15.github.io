import type { Contribution, PortfolioLabels, Project } from "../content";
import ProjectVisual from "../ProjectVisuals";
import { TagList } from "./TagList";

type ProjectCardProps = {
  project: Project;
  labels: PortfolioLabels;
};

export function ProjectCard({ project, labels }: ProjectCardProps) {
  return (
    <article
      className={`project-card project-card-${project.visual} project-card--${project.layout}`}
      data-content-id={project.id}
      data-project-layout={project.layout}
      data-visual-key={project.visual}
      data-reveal
    >
      <ProjectVisual kind={project.visual} />
      <div className="project-copy">
        <p className="project-eyebrow">{project.eyebrow}</p>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <ul>
          {project.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
        <TagList
          items={project.tags}
          className="project-stack"
          label={labels.technologiesForProject(project.title)}
        />
        {project.links?.length ? (
          <div className="text-links">
            {project.links.map((link) => (
              <a href={link.href} key={link.id}>
                {link.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

type ProjectGridProps = {
  projects: readonly Project[];
  labels: PortfolioLabels;
  className?: string;
};

export function ProjectGrid({ projects, labels, className = "" }: ProjectGridProps) {
  return (
    <div className={`project-grid ${className}`.trim()}>
      {projects.map((project) => (
        <ProjectCard project={project} labels={labels} key={project.id} />
      ))}
    </div>
  );
}

type ContributionsProps = {
  contributions: readonly Contribution[];
  labels: PortfolioLabels;
};

export function Contributions({ contributions, labels }: ContributionsProps) {
  const mergedPrCount = contributions.reduce(
    (total, contribution) => total + contribution.mergedPrCount,
    0,
  );

  return (
    <div className="open-source-contributions" aria-labelledby="contributions-title">
      <div className="contribution-header" data-reveal>
        <div>
          <p className="eyebrow">{labels.publicPullRequests}</p>
          <h3 id="contributions-title">{labels.contributionsTitle}</h3>
        </div>
        <div className="contribution-summary" aria-label={labels.contributionTotals}>
          <span><strong>{contributions.length}</strong> {labels.repositories}</span>
          <span><strong>{mergedPrCount}</strong> {labels.mergedPullRequests}</span>
        </div>
      </div>
      <div className="contribution-list">
        {contributions.map((contribution) => (
          <article
            className="contribution-row"
            key={contribution.id}
            data-content-id={contribution.id}
            data-reveal
          >
            <div className="contribution-source">
              <strong>{contribution.repository}</strong>
              <a href={contribution.href}>{contribution.linkLabel}</a>
            </div>
            <p>{contribution.description}</p>
            <TagList
              items={contribution.tags}
              className="contribution-tags"
              label={labels.technologiesForContribution(contribution.repository)}
            />
          </article>
        ))}
      </div>
    </div>
  );
}
