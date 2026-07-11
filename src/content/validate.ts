import type { PortfolioContent, ProjectVisualKey } from "./types";

const SUPPORTED_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

export type ContentValidationOptions = {
  visualKeys: ReadonlySet<ProjectVisualKey>;
};

function isSupportedHref(href: string) {
  if (href.startsWith("/") || href.startsWith("#")) return true;

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

  return errors;
}

export function assertValidContent(
  content: PortfolioContent,
  options: ContentValidationOptions,
) {
  const errors = collectContentValidationErrors(content, options);
  if (errors.length > 0) throw new Error(errors.join("\n"));
}
