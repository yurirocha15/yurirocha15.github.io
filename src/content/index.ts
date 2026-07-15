import { englishPortfolioContent } from "./locales/en";
import { koreanPortfolioContent } from "./locales/ko";
import type { Locale, PortfolioContent } from "./types";

export const portfolioContentByLocale = {
  en: englishPortfolioContent,
  ko: koreanPortfolioContent,
} satisfies Record<Locale, PortfolioContent>;

export { englishPortfolioContent, koreanPortfolioContent };

/** English remains the compatibility default for callers that have not selected a locale. */
export const portfolioContent: PortfolioContent = portfolioContentByLocale.en;

export function getPortfolioContent(locale: Locale): PortfolioContent {
  return portfolioContentByLocale[locale];
}

export * from "./locale";
export * from "./types";
