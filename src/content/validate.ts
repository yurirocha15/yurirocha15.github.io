import type { PortfolioContent, ProjectVisualKey } from "./types";

const SUPPORTED_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

export type ContentValidationOptions = {
  visualKeys: ReadonlySet<ProjectVisualKey>;
};

function isSupportedHref(href: string) {
  if (href.startsWith("/") || href.startsWith("./") || href.startsWith("#")) return true;

  try {
    return SUPPORTED_PROTOCOLS.has(new URL(href).protocol);
  } catch {
    return false;
  }
}

export function collectContentValidationErrors(
  content: PortfolioContent,
  { visualKeys }: ContentValidationOptions,
) {
  const errors: string[] = [];
  const ids = new Set<string>();
  const addId = (id: string, kind: string) => {
    if (!id) errors.push(`${kind} has an empty id`);
    if (ids.has(id)) errors.push(`Duplicate id: ${id}`);
    ids.add(id);
  };

  const sections = Object.values(content.sections);
  sections.forEach((section) => {
    if (section.id) addId(section.id, "section");
  });
  addId("top", "main");
  addId("contact", "footer");

  content.profile.navigation.forEach((item) => {
    addId(item.id, "navigation item");
    if (!ids.has(item.targetId)) errors.push(`Navigation target does not exist: ${item.targetId}`);
  });
  content.profile.engineeringProfile.groups.forEach((group) => {
    addId(group.id, "capability group");
  });
  content.profile.proofItems.forEach((item) => addId(item.id, "proof item"));

  const projects = [...content.professionalProjects, ...content.openSourceProjects];
  const links = [
    ...content.profile.links,
    ...projects.flatMap((project) => project.links ?? []),
  ];

  content.experience.forEach((item) => addId(item.id, "experience"));
  projects.forEach((project) => {
    addId(project.id, "project");
    if (!visualKeys.has(project.visual)) {
      errors.push(`Project ${project.id} uses an unregistered visual: ${project.visual}`);
    }
  });
  content.contributions.forEach((contribution) => {
    addId(contribution.id, "contribution");
    if (contribution.mergedPrCount < 0) {
      errors.push(`Contribution ${contribution.id} has a negative merged PR count`);
    }
    if (!isSupportedHref(contribution.href)) {
      errors.push(`Contribution ${contribution.id} has an invalid URL`);
    }
  });
  content.publications.forEach((publication) => {
    addId(publication.id, "publication");
    if (!isSupportedHref(publication.href)) {
      errors.push(`Publication ${publication.id} has an invalid URL`);
    }
  });
  content.awards.forEach((award) => addId(award.id, "award"));
  content.skills.forEach((group) => addId(group.id, "skill group"));
  content.languages.forEach((language) => addId(language.id, "language"));
  links.forEach((link) => {
    addId(link.id, "link");
    if (link.locations.length === 0) errors.push(`Link ${link.id} has no display location`);
    if (!isSupportedHref(link.href)) errors.push(`Link ${link.id} has an invalid URL`);
  });

  const primaryLinks = content.profile.links.filter((link) => link.primary);
  if (primaryLinks.length !== 1) errors.push("Profile must define exactly one primary link");

  const cvLinks = content.profile.links.filter((link) => link.id === "cv");
  if (cvLinks.length !== 1) {
    errors.push("Profile must define exactly one CV link");
  } else if (cvLinks[0].href !== `./cv/yuri-rocha-cv-${content.locale}.pdf`) {
    errors.push(`CV link does not match locale: ${content.locale}`);
  }

  return errors;
}

export function assertValidContent(
  content: PortfolioContent,
  options: ContentValidationOptions,
) {
  const errors = collectContentValidationErrors(content, options);
  if (errors.length > 0) throw new Error(errors.join("\n"));
}

type Identified = { id: string };

function sameValues(left: readonly unknown[], right: readonly unknown[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function compareIdSequence(
  errors: string[],
  label: string,
  reference: readonly Identified[],
  candidate: readonly Identified[],
) {
  const referenceIds = reference.map(({ id }) => id);
  const candidateIds = candidate.map(({ id }) => id);
  if (!sameValues(referenceIds, candidateIds)) {
    errors.push(`${label} IDs or ordering differ`);
  }
}

/**
 * Checks the locale-invariant content skeleton. Copy may differ, but navigation,
 * rendering keys, public destinations, and ordered identities must stay aligned.
 */
export function collectContentParityErrors(
  reference: PortfolioContent,
  candidate: PortfolioContent,
) {
  const errors: string[] = [];

  const referenceSections = Object.entries(reference.sections);
  const candidateSections = Object.entries(candidate.sections);
  if (!sameValues(referenceSections.map(([key]) => key), candidateSections.map(([key]) => key))) {
    errors.push("Section keys or ordering differ");
  }
  referenceSections.forEach(([key, section], index) => {
    const other = candidateSections[index]?.[1];
    if (!other || section.id !== other.id || section.tone !== other.tone) {
      errors.push(`Section structure differs: ${key}`);
    }
  });

  compareIdSequence(
    errors,
    "Navigation",
    reference.profile.navigation,
    candidate.profile.navigation,
  );
  reference.profile.navigation.forEach((item, index) => {
    if (item.targetId !== candidate.profile.navigation[index]?.targetId) {
      errors.push(`Navigation target differs: ${item.id}`);
    }
  });

  compareIdSequence(errors, "Profile link", reference.profile.links, candidate.profile.links);
  reference.profile.links.forEach((link, index) => {
    const other = candidate.profile.links[index];
    if (!other) return;

    // The CV link is intentionally locale-specific; every other destination is canonical.
    if (link.id !== "cv" && link.href !== other.href) {
      errors.push(`Profile link destination differs: ${link.id}`);
    }
    if (
      !sameValues(link.locations, other.locations)
      || Boolean(link.primary) !== Boolean(other.primary)
      || Boolean(link.hideOnMobile) !== Boolean(other.hideOnMobile)
    ) {
      errors.push(`Profile link placement differs: ${link.id}`);
    }
  });

  compareIdSequence(errors, "Experience", reference.experience, candidate.experience);
  compareIdSequence(
    errors,
    "Professional project",
    reference.professionalProjects,
    candidate.professionalProjects,
  );
  compareIdSequence(
    errors,
    "Open-source project",
    reference.openSourceProjects,
    candidate.openSourceProjects,
  );

  const referenceProjects = [...reference.professionalProjects, ...reference.openSourceProjects];
  const candidateProjects = [...candidate.professionalProjects, ...candidate.openSourceProjects];
  referenceProjects.forEach((project, index) => {
    const other = candidateProjects[index];
    if (!other) return;
    if (project.visual !== other.visual || project.layout !== other.layout) {
      errors.push(`Project rendering structure differs: ${project.id}`);
    }

    const links = project.links ?? [];
    const otherLinks = other.links ?? [];
    compareIdSequence(errors, `Project ${project.id} link`, links, otherLinks);
    links.forEach((link, linkIndex) => {
      const otherLink = otherLinks[linkIndex];
      if (
        !otherLink
        || link.href !== otherLink.href
        || !sameValues(link.locations, otherLink.locations)
      ) {
        errors.push(`Project link structure differs: ${link.id}`);
      }
    });
  });

  compareIdSequence(errors, "Contribution", reference.contributions, candidate.contributions);
  reference.contributions.forEach((item, index) => {
    const other = candidate.contributions[index];
    if (!other || item.href !== other.href || item.mergedPrCount !== other.mergedPrCount) {
      errors.push(`Contribution structure differs: ${item.id}`);
    }
  });

  compareIdSequence(errors, "Publication", reference.publications, candidate.publications);
  reference.publications.forEach((item, index) => {
    if (item.href !== candidate.publications[index]?.href) {
      errors.push(`Publication destination differs: ${item.id}`);
    }
  });

  compareIdSequence(errors, "Award", reference.awards, candidate.awards);
  compareIdSequence(errors, "Skill group", reference.skills, candidate.skills);
  compareIdSequence(errors, "Language", reference.languages, candidate.languages);
  reference.languages.forEach((item, index) => {
    if (item.flag !== candidate.languages[index]?.flag) {
      errors.push(`Language flag differs: ${item.id}`);
    }
  });

  return errors;
}

export function assertContentParity(reference: PortfolioContent, candidate: PortfolioContent) {
  const errors = collectContentParityErrors(reference, candidate);
  if (errors.length > 0) throw new Error(errors.join("\n"));
}
