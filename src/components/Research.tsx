import type { Award, Publication } from "../content";

type PublicationListProps = {
  items: readonly Publication[];
};

export function PublicationList({ items }: PublicationListProps) {
  return (
    <div className="paper-list section-content">
      {items.map((paper) => (
        <a
          className="paper-row"
          href={paper.href}
          key={paper.id}
          data-content-id={paper.id}
          data-reveal
        >
          <span>{paper.year}</span>
          <strong>{paper.title}</strong>
          <em>{paper.venue}</em>
        </a>
      ))}
    </div>
  );
}

type AwardListProps = {
  items: readonly Award[];
};

export function AwardList({ items }: AwardListProps) {
  return (
    <div className="paper-list section-content">
      {items.map((award) => (
        <article
          className="paper-row award-row"
          key={award.id}
          data-content-id={award.id}
          data-reveal
        >
          <span>{award.year}</span>
          <strong>{award.title}</strong>
          <em>{award.detail}</em>
        </article>
      ))}
    </div>
  );
}
