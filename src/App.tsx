import { Contributions, ProjectGrid } from "./components/Projects";
import { AwardList, PublicationList } from "./components/Research";
import { SectionFrame } from "./components/SectionFrame";
import { LanguageList, SkillsGrid } from "./components/Skills";
import { Hero } from "./components/Hero";
import { SiteFooter, SiteHeader } from "./components/SiteChrome";
import { Timeline } from "./components/Timeline";
import { portfolioContent } from "./content";
import { useScrollReveal } from "./hooks/useScrollReveal";
import { useVisualActivity } from "./hooks/useVisualActivity";

function App() {
  useScrollReveal();
  useVisualActivity();

  const { profile, sections } = portfolioContent;

  return (
    <div className="site-shell">
      <a className="skip-link" href="#top">
        {profile.skipLinkLabel}
      </a>
      <SiteHeader
        identity={profile.identity}
        navigation={profile.navigation}
        navigationLabel={profile.labels.mainNavigation}
      />

      <main id="top" tabIndex={-1}>
        <Hero profile={profile} />

        <SectionFrame section={sections.career}>
          <Timeline items={portfolioContent.experience} labels={profile.labels} />
        </SectionFrame>

        <SectionFrame section={sections.professional}>
          <div className="section-content">
            <ProjectGrid
              projects={portfolioContent.professionalProjects}
              labels={profile.labels}
            />
          </div>
        </SectionFrame>

        <SectionFrame section={sections.openSource}>
          <div className="open-source-content section-content">
            <ProjectGrid
              projects={portfolioContent.openSourceProjects}
              labels={profile.labels}
              className="open-source-grid"
            />
            <Contributions
              contributions={portfolioContent.contributions}
              labels={profile.labels}
            />
          </div>
        </SectionFrame>

        <SectionFrame section={sections.research}>
          <PublicationList items={portfolioContent.publications} />
        </SectionFrame>

        <SectionFrame section={sections.awards}>
          <AwardList items={portfolioContent.awards} />
        </SectionFrame>

        <SectionFrame section={sections.skills}>
          <SkillsGrid groups={portfolioContent.skills} labels={profile.labels} />
        </SectionFrame>

        <SectionFrame section={sections.languages}>
          <LanguageList
            languages={portfolioContent.languages}
            label={profile.labels.spokenLanguages}
          />
        </SectionFrame>
      </main>

      <SiteFooter profile={profile} />
    </div>
  );
}

export default App;
