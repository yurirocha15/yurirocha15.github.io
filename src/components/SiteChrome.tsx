import { Fragment, type JSX, useEffect, useId, useRef, useState } from "react";
import type { Locale, NavigationItem, ProfileContent } from "../content";
import { ProfileLinkButton } from "./ProfileLinkButton";

export type SiteHeaderProps = {
  identity: ProfileContent["identity"];
  navigation: readonly NavigationItem[];
  navigationLabel: string;
  menuOpenLabel: string;
  menuCloseLabel: string;
  languageSelectorLabel: string;
  switchToEnglishLabel: string;
  switchToKoreanLabel: string;
  switchToPortugueseLabel: string;
  currentLocale: Locale;
  onLocaleChange: (locale: Locale) => void;
};

type LocaleSelectorProps = Pick<
  SiteHeaderProps,
  | "currentLocale"
  | "languageSelectorLabel"
  | "switchToEnglishLabel"
  | "switchToKoreanLabel"
  | "switchToPortugueseLabel"
> & {
  onSelect: (locale: Locale) => void;
};

function LocaleSelector({
  currentLocale,
  languageSelectorLabel,
  switchToEnglishLabel,
  switchToKoreanLabel,
  switchToPortugueseLabel,
  onSelect,
}: LocaleSelectorProps): JSX.Element {
  const options = [
    { accessibleLabel: switchToEnglishLabel, label: "EN", locale: "en" },
    { accessibleLabel: switchToKoreanLabel, label: "한국어", locale: "ko" },
    {
      accessibleLabel: switchToPortugueseLabel,
      label: "PT-BR",
      locale: "pt-BR",
    },
  ] satisfies readonly {
    accessibleLabel: string;
    label: string;
    locale: Locale;
  }[];

  return (
    <div className="locale-selector" role="group" aria-label={languageSelectorLabel}>
      {options.map(({ accessibleLabel, label, locale }, index) => (
        <Fragment key={locale}>
          {index > 0 && <span aria-hidden="true">/</span>}
          <button
            aria-label={accessibleLabel}
            aria-pressed={currentLocale === locale}
            className="locale-option"
            lang={locale}
            onClick={() => onSelect(locale)}
            type="button"
          >
            {label}
          </button>
        </Fragment>
      ))}
    </div>
  );
}

function BrandMonogram(): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className="brand-monogram"
      focusable="false"
      viewBox="0 0 48 36"
    >
      <path
        className="brand-monogram-stroke"
        d="M3.5 4.5 12.5 15.5 21.5 4.5M12.5 15.5v16M26.5 31.5v-27h8c5.8 0 9 2.7 9 7.2 0 4.6-3.2 7.3-9 7.3h-8"
      />
      <path className="brand-monogram-stroke brand-monogram-leg" d="M34.5 19 44 31.5" />
      <circle className="brand-monogram-node" cx="44" cy="31.5" r="2.5" />
    </svg>
  );
}

export function SiteHeader({
  identity,
  navigation,
  navigationLabel,
  menuOpenLabel,
  menuCloseLabel,
  languageSelectorLabel,
  switchToEnglishLabel,
  switchToKoreanLabel,
  switchToPortugueseLabel,
  currentLocale,
  onLocaleChange,
}: SiteHeaderProps): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navigationPanelId = useId();

  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      setIsMenuOpen(false);
      menuButtonRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 721px)");
    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsMenuOpen(false);
    };

    desktopQuery.addEventListener("change", handleBreakpointChange);
    return () => desktopQuery.removeEventListener("change", handleBreakpointChange);
  }, []);

  function closeAndFocusTarget(targetId: string): void {
    setIsMenuOpen(false);
    window.requestAnimationFrame(() => {
      const target = document.getElementById(targetId);
      if (!target) return;

      if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
      target.focus({ preventScroll: true });
    });
  }

  function selectLocale(locale: Locale): void {
    setIsMenuOpen(false);
    onLocaleChange(locale);
  }

  return (
    <header
      className={`site-header${isMenuOpen ? " is-menu-open" : ""}`}
      ref={headerRef}
    >
      <div className="site-header-row">
        <a
          className="brand"
          href="#top"
          aria-label={identity.homeLabel}
          onClick={() => closeAndFocusTarget("top")}
        >
          <BrandMonogram />
          <span>
            <strong>{identity.name}</strong>
            <small>{identity.title}</small>
          </span>
        </a>
        <button
          aria-controls={navigationPanelId}
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? menuCloseLabel : menuOpenLabel}
          className="menu-toggle"
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          ref={menuButtonRef}
          type="button"
        >
          <span className="menu-toggle-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>
      <div className="site-header-actions" id={navigationPanelId}>
        <nav className="nav-links" aria-label={navigationLabel}>
          {navigation.map((item) => (
            <a
              className="chrome-link"
              href={`#${item.targetId}`}
              key={item.id}
              onClick={() => closeAndFocusTarget(item.targetId)}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <LocaleSelector
          currentLocale={currentLocale}
          languageSelectorLabel={languageSelectorLabel}
          onSelect={selectLocale}
          switchToEnglishLabel={switchToEnglishLabel}
          switchToKoreanLabel={switchToKoreanLabel}
          switchToPortugueseLabel={switchToPortugueseLabel}
        />
      </div>
    </header>
  );
}

type SiteFooterProps = {
  profile: ProfileContent;
};

export function SiteFooter({ profile }: SiteFooterProps) {
  const footerLinks = profile.links.filter((link) => link.locations.includes("footer"));

  return (
    <footer className="site-footer" id="contact">
      <div>
        <p className="eyebrow">{profile.contact.eyebrow}</p>
        <h2>{profile.contact.location}</h2>
        <a className="footer-email" href={profile.contact.emailHref}>{profile.contact.email}</a>
      </div>
      <div className="footer-links">
        {footerLinks.map((link) => (
          <ProfileLinkButton link={link} key={link.id} />
        ))}
      </div>
    </footer>
  );
}
