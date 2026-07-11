import { lazy, Suspense } from "react";
import type { ProfileContent } from "../content";
import { TagList } from "./TagList";

const HeroRobotScene = lazy(() => import("../HeroRobotScene"));

type HeroProps = {
  profile: ProfileContent;
};

export function Hero({ profile }: HeroProps) {
  const heroLinks = profile.links.filter((link) => link.locations.includes("hero"));

  return (
    <>
      <section className="hero section-band">
        <div className="hero-copy" data-reveal>
          <TagList
            items={profile.hero.metadata}
            className="hero-meta"
            label={profile.labels.roleAndLocation}
          />
          <h1>{profile.hero.heading}</h1>
          <p className="lead">{profile.hero.lead}</p>
          <div className="hero-actions" aria-label={profile.labels.primaryLinks}>
            {heroLinks.map((link) => {
              const classes = [
                "button",
                link.primary ? "button-primary" : "",
                link.hideOnMobile ? "button--mobile-hidden" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <a className={classes} href={link.href} key={link.id}>
                  {link.label}
                </a>
              );
            })}
          </div>
        </div>

        <div
          className="planning-board"
          aria-label={profile.labels.engineeringCapabilities}
          data-reveal
        >
          <div className="board-header">
            <span>{profile.engineeringProfile.label}</span>
            <strong>{profile.engineeringProfile.title}</strong>
          </div>
          <Suspense fallback={<div className="robot-scene-panel robot-scene-fallback" />}>
            <HeroRobotScene />
          </Suspense>
          <dl className="board-metrics">
            {profile.engineeringProfile.groups.map((group) => (
              <div key={group.id}>
                <dt>{group.title}</dt>
                <dd>
                  <TagList items={group.items} className="capability-tags" />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section
        className="section-band proof-strip"
        aria-label={profile.labels.professionalSnapshot}
      >
        {profile.proofItems.map((item) => (
          <div className="proof-item" data-reveal key={item.id}>
            <span>{item.label}</span>
            <strong>{item.detail}</strong>
          </div>
        ))}
      </section>
    </>
  );
}
