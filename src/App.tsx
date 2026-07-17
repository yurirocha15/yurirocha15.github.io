import { useEffect, useState } from "react";
import { Contributions, ProjectGrid } from "./components/Projects";
import { AwardList, PublicationList } from "./components/Research";
import { SectionFrame } from "./components/SectionFrame";
import { LanguageList, SkillsGrid } from "./components/Skills";
import { Hero } from "./components/Hero";
import { SiteFooter, SiteHeader } from "./components/SiteChrome";
import { Timeline } from "./components/Timeline";
import { portfolioContentByLocale, type Locale } from "./content";
import { useScrollReveal } from "./hooks/useScrollReveal";
import { useVisualActivity } from "./hooks/useVisualActivity";
import { applyDocumentMetadata, replaceLocaleInUrl, resolveInitialLocale } from "./locale";

type AppProps = {
  initialLocale?: Locale;
};

function App({ initialLocale = resolveInitialLocale() }: AppProps) {
  const [locale, setLocale] = useState(initialLocale);
  const content = portfolioContentByLocale[locale];
  const { profile, sections } = content;

  useScrollReveal();
  useVisualActivity();

  useEffect(() => applyDocumentMetadata(content), [content]);

  function selectLocale(nextLocale: Locale): void {
    replaceLocaleInUrl(nextLocale);
    setLocale(nextLocale);
  }

  return (
    <div className="site-shell">
      <a className="skip-link" href="#top">
        {profile.skipLinkLabel}
      </a>
      <SiteHeader
        identity={profile.identity}
        navigation={profile.navigation}
        navigationLabel={profile.labels.mainNavigation}
        menuOpenLabel={profile.labels.openMenu}
        menuCloseLabel={profile.labels.closeMenu}
        languageSelectorLabel={profile.labels.languageSelector}
        switchToEnglishLabel={profile.labels.switchToEnglish}
        switchToKoreanLabel={profile.labels.switchToKorean}
        switchToPortugueseLabel={profile.labels.switchToPortuguese}
        currentLocale={locale}
        onLocaleChange={selectLocale}
      />

      <main id="top" tabIndex={-1}>
        <Hero profile={profile} visualLabels={content.visuals} />

        <SectionFrame section={sections.career}>
          <Timeline items={content.experience} labels={profile.labels} />
        </SectionFrame>

        <SectionFrame section={sections.professional}>
          <div className="section-content">
            <ProjectGrid
              projects={content.professionalProjects}
              labels={profile.labels}
              visualLabels={content.visuals}
            />
          </div>
        </SectionFrame>

        <SectionFrame section={sections.openSource}>
          <div className="open-source-content section-content">
            <ProjectGrid
              projects={content.openSourceProjects}
              labels={profile.labels}
              visualLabels={content.visuals}
              className="open-source-grid"
            />
            <Contributions
              contributions={content.contributions}
              labels={profile.labels}
            />
          </div>
        </SectionFrame>

        <SectionFrame section={sections.research}>
          <PublicationList items={content.publications} />
        </SectionFrame>

        <SectionFrame section={sections.awards}>
          <AwardList items={content.awards} />
        </SectionFrame>

        <SectionFrame section={sections.skills}>
          <SkillsGrid groups={content.skills} labels={profile.labels} />
        </SectionFrame>

        <SectionFrame section={sections.languages}>
          <LanguageList
            languages={content.languages}
            label={profile.labels.spokenLanguages}
          />
        </SectionFrame>
      </main>

      <SiteFooter profile={profile} />
    </div>
  );
}

export default App;
