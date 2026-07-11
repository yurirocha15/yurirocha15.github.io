import type { Link } from "../content";

type ProfileLinkButtonProps = {
  link: Link;
};

export function ProfileLinkButton({ link }: ProfileLinkButtonProps) {
  const className = [
    "button",
    link.primary ? "button-primary" : "",
    link.hideOnMobile ? "button--mobile-hidden" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <a className={className} href={link.href}>
      {link.label}
    </a>
  );
}
