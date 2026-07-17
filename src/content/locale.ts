import type { Locale } from "./types";

export const SUPPORTED_LOCALES = ["en", "ko", "pt-BR"] as const satisfies readonly Locale[];
export const DEFAULT_LOCALE: Locale = "en";

const supportedLocaleSet = new Set<string>(SUPPORTED_LOCALES);
const localeByLanguage = new Map<string, Locale>(
  SUPPORTED_LOCALES.map((locale) => [locale.split("-")[0].toLowerCase(), locale]),
);

export type LocaleResolutionInput = {
  search?: unknown;
  languages?: readonly unknown[] | null;
  language?: unknown;
};

export type LocaleUrlParts = {
  pathname: string;
  search?: string;
  hash?: string;
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && supportedLocaleSet.has(value);
}

export function normalizeBrowserLocale(value: unknown): Locale | undefined {
  if (typeof value !== "string") return undefined;

  const language = value.trim().toLowerCase().replaceAll("_", "-").split("-")[0];
  return localeByLanguage.get(language);
}

function localeFromSearch(search: unknown) {
  if (typeof search !== "string") return { present: false } as const;

  const parameters = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (!parameters.has("lang")) return { present: false } as const;

  const value = parameters.get("lang");
  return {
    present: true,
    locale: isLocale(value) ? value : undefined,
  } as const;
}

export function resolveLocale({
  search = "",
  languages = [],
  language,
}: LocaleResolutionInput = {}): Locale {
  const queryLocale = localeFromSearch(search);
  if (queryLocale.present) return queryLocale.locale ?? DEFAULT_LOCALE;

  for (const candidate of languages ?? []) {
    const locale = normalizeBrowserLocale(candidate);
    if (locale) return locale;
  }

  return normalizeBrowserLocale(language) ?? DEFAULT_LOCALE;
}

export function buildLocaleUrl(
  { pathname, search = "", hash = "" }: LocaleUrlParts,
  locale: Locale,
) {
  const parameters = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  parameters.set("lang", locale);

  const query = parameters.toString();
  const normalizedHash = hash && !hash.startsWith("#") ? `#${hash}` : hash;
  return `${pathname}${query ? `?${query}` : ""}${normalizedHash}`;
}
