import { experience } from "./career";
import { profile, sections } from "./profile";
import { contributions, openSourceProjects, professionalProjects } from "./projects";
import { awards, publications } from "./research";
import { languages, skills } from "./skills";
import type { PortfolioContent } from "./types";

export const portfolioContent = {
  profile,
  sections,
  experience,
  professionalProjects,
  openSourceProjects,
  contributions,
  publications,
  awards,
  skills,
  languages,
} satisfies PortfolioContent;

export * from "./types";
