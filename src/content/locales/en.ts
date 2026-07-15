import { experience } from "../career";
import { profile, sections } from "../profile";
import { contributions, openSourceProjects, professionalProjects } from "../projects";
import { awards, publications } from "../research";
import { languages, skills } from "../skills";
import type { PortfolioContent } from "../types";
import { englishVisualLabels } from "../visualLabels";

export const englishPortfolioContent = {
  locale: "en",
  metadata: {
    title: "Yuri Rocha - Robotics Software & Physical AI",
    description:
      "Yuri Rocha, Senior Robotics Software Engineer building real-time robot controllers, agentic robotics interfaces, motion-planning systems, and Kubernetes LLMOps infrastructure.",
  },
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
  visuals: englishVisualLabels,
} satisfies PortfolioContent;
