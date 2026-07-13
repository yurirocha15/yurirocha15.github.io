import {
  DEFAULT_LOCALE,
  buildLocaleUrl,
  resolveLocale,
  type Locale,
  type PortfolioContent,
} from "./content";

type LocaleLocation = Pick<Location, "hash" | "pathname" | "search">;
type BrowserLocale = Pick<Navigator, "language" | "languages">;
type LocaleHistory = Pick<History, "replaceState" | "state">;

export function resolveInitialLocale(
  location: LocaleLocation = window.location,
  browser: BrowserLocale = window.navigator,
): Locale {
  try {
    return resolveLocale({
      search: location.search,
      languages: browser.languages,
      language: browser.language,
    });
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function replaceLocaleInUrl(
  locale: Locale,
  location: LocaleLocation = window.location,
  history: LocaleHistory = window.history,
): void {
  const nextUrl = buildLocaleUrl(location, locale);
  history.replaceState(history.state, "", nextUrl);
}

export function applyDocumentMetadata(content: PortfolioContent): void {
  document.documentElement.lang = content.locale;
  document.title = content.metadata.title;

  let description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!description) {
    description = document.createElement("meta");
    description.name = "description";
    document.head.append(description);
  }
  description.content = content.metadata.description;
}
