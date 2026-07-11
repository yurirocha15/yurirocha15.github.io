import type { Experience, PortfolioLabels } from "../content";
import { TagList } from "./TagList";

type TimelineProps = {
  items: readonly Experience[];
  labels: PortfolioLabels;
};

export function Timeline({ items, labels }: TimelineProps) {
  return (
    <div className="timeline section-content">
      {items.map((item) => (
        <article className="timeline-item" key={item.id} data-reveal data-content-id={item.id}>
          <div className="timeline-period">{item.period}</div>
          <div className="timeline-body">
            <p className="role">{item.role}</p>
            <h3>{item.company}</h3>
            <p className="timeline-detail">{item.detail}</p>
            <ul>
              {item.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
            <TagList
              items={item.tags}
              className="tag-row"
              label={labels.technologiesForExperience(item.company)}
            />
          </div>
        </article>
      ))}
    </div>
  );
}
