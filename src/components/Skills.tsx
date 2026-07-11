import type { Language, PortfolioLabels, TagGroup } from "../content";
import { TagList } from "./TagList";

type SkillsGridProps = {
  groups: readonly TagGroup[];
  labels: PortfolioLabels;
};

export function SkillsGrid({ groups, labels }: SkillsGridProps) {
  return (
    <div className="skills-grid section-content">
      {groups.map((group) => (
        <article className="skill-block" key={group.id} data-reveal data-content-id={group.id}>
          <h3>{group.title}</h3>
          <TagList
            items={group.items}
            className="skill-tags"
            label={labels.skillsForGroup(group.title)}
          />
        </article>
      ))}
    </div>
  );
}

type LanguageListProps = {
  languages: readonly Language[];
  label: string;
};

export function LanguageList({ languages, label }: LanguageListProps) {
  return (
    <div className="section-content language-panel" data-reveal>
      <TagList
        items={languages.map((language) => `${language.flag} ${language.name}`)}
        className="language-tags"
        label={label}
      />
    </div>
  );
}
