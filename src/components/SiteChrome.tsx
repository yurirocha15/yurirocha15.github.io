import type { NavigationItem, ProfileContent } from "../content";

type SiteHeaderProps = {
  identity: ProfileContent["identity"];
  navigation: readonly NavigationItem[];
  navigationLabel: string;
};

export function SiteHeader({ identity, navigation, navigationLabel }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label={identity.homeLabel}>
        <span className="brand-mark">{identity.mark}</span>
        <span>
          <strong>{identity.name}</strong>
          <small>{identity.title}</small>
        </span>
      </a>
      <nav className="nav-links" aria-label={navigationLabel}>
        {navigation.map((item) => (
          <a href={`#${item.targetId}`} key={item.id}>
            {item.label}
          </a>
        ))}
      </nav>
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
      <div data-reveal>
        <p className="eyebrow">{profile.contact.eyebrow}</p>
        <h2>{profile.contact.location}</h2>
        <a href={profile.contact.emailHref}>{profile.contact.email}</a>
      </div>
      <div className="footer-links" data-reveal>
        {footerLinks.map((link) => (
          <a href={link.href} key={link.id}>
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  );
}
