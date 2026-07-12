import type { NavigationItem, ProfileContent } from "../content";
import { ProfileLinkButton } from "./ProfileLinkButton";

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
          <a className="chrome-link" href={`#${item.targetId}`} key={item.id}>
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
