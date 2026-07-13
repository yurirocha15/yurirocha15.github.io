import { experience } from "./career";
import { koreanPortfolioContent } from "./locales/ko";
import { profile, sections } from "./profile";
import { contributions, openSourceProjects, professionalProjects } from "./projects";
import { awards, publications } from "./research";
import { languages, skills } from "./skills";
import type { Locale, PortfolioContent } from "./types";
import { englishVisualLabels } from "./visualLabels";

export const englishPortfolioContent = {
  locale: "en",
  metadata: {
    title: "Yuri Rocha - Robotics Software & Physical AI",
    description:
      "Yuri Rocha, Senior Robotics Software Engineer building real-time robot controllers, agentic robotics interfaces, motion-planning systems, and Kubernetes LLMOps infrastructure.",
  },
  profile,
  sections,
  experience,
  professionalProjects,
  openSourceProjects,
  contributions,
  publications,
  awards,
  skills,
  languages,
  visuals: englishVisualLabels,
} satisfies PortfolioContent;

export const portfolioContentByLocale = {
  en: englishPortfolioContent,
  ko: koreanPortfolioContent,
} satisfies Record<Locale, PortfolioContent>;

export { koreanPortfolioContent };

/** English remains the compatibility default for callers that have not selected a locale. */
export const portfolioContent: PortfolioContent = portfolioContentByLocale.en;

export function getPortfolioContent(locale: Locale) {
  return portfolioContentByLocale[locale];
}

export * from "./locale";
export * from "./types";
