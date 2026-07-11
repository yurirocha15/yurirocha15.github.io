import type { ReactNode } from "react";
import type { SectionDefinition } from "../content";

type SectionFrameProps = {
  section: SectionDefinition;
  children: ReactNode;
};

export function SectionFrame({ section, children }: SectionFrameProps) {
  return (
    <section
      className={`section-grid section-tone-${section.tone}`}
      id={section.id}
      data-section-tone={section.tone}
    >
      <div className="section-label" data-reveal>
        <h2 className="section-heading">{section.title}</h2>
      </div>
      {children}
    </section>
  );
}
