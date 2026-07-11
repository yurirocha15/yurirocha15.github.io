import type { ProfileContent, SectionDefinition } from "./types";

export const profile = {
  skipLinkLabel: "Skip to content",
  identity: {
    name: "Yuri Rocha",
    title: "Robotics & AI Engineer",
    mark: "YR",
    homeLabel: "Yuri Rocha home",
  },
  navigation: [
    { id: "nav-career", label: "Career", targetId: "career" },
    { id: "nav-professional", label: "Professional", targetId: "professional" },
    { id: "nav-open-source", label: "Open Source", targetId: "open-source" },
    { id: "nav-research", label: "Research", targetId: "research" },
    { id: "nav-contact", label: "Contact", targetId: "contact" },
  ],
  links: [
    {
      id: "github",
      label: "GitHub",
      href: "https://github.com/yurirocha15",
      locations: ["hero", "footer"],
      primary: true,
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/yurirocha15/",
      locations: ["hero", "footer"],
    },
    {
      id: "cv",
      label: "CV",
      href: "/assets/cv_yuri_website.pdf",
      locations: ["hero", "footer"],
    },
    {
      id: "email",
      label: "Email",
      href: "mailto:yurirocha15@gmail.com",
      locations: ["hero", "footer"],
      hideOnMobile: true,
    },
  ],
  hero: {
    metadata: ["Senior Robotics Software Engineer", "Seoul, South Korea"],
    heading: "Performant, intelligent robot software.",
    lead:
      "I build real-time robot controllers, motion-planning systems, on-device inference, and GPU-backed deployment platforms for robotics teams.",
  },
  engineeringProfile: {
    label: "Engineering profile",
    title: "Robotics software engineer",
    groups: [
      { id: "capability-real-time", title: "Real-time", items: ["C++", "Linux", "Task Scheduling", "IPC"] },
      {
        id: "capability-robotics",
        title: "Robotics",
        items: ["ROS 2", "Robot Controllers", "Motion Planning"],
      },
      {
        id: "capability-ai-systems",
        title: "AI systems",
        items: ["LLMs", "ONNX", "Edge Inference", "GPU Inference"],
      },
      {
        id: "capability-infrastructure",
        title: "Infrastructure",
        items: ["Kubernetes", "APIs", "Isaac Sim", "MuJoCo"],
      },
    ],
  },
  proofItems: [
    {
      id: "proof-current",
      label: "Current",
      detail: "Real-time robot controller and on-prem AI deployment platform",
    },
    {
      id: "proof-hackathon",
      label: "Hackathon win",
      detail: "2026 NVIDIA Cosmos Cookoff, first place among 1,600+ participants",
    },
    {
      id: "proof-open-source",
      label: "Latest open-source project",
      detail: "mcp-cpp-sdk: a C++20 SDK connecting native software to AI agents",
    },
  ],
  contact: {
    eyebrow: "Contact",
    location: "Seoul, South Korea",
    email: "yurirocha15@gmail.com",
    emailHref: "mailto:yurirocha15@gmail.com",
  },
  labels: {
    mainNavigation: "Main navigation",
    primaryLinks: "Primary links",
    roleAndLocation: "Role and location",
    engineeringCapabilities: "Robotics software engineering capabilities",
    professionalSnapshot: "Professional snapshot",
    contributionTotals: "Contribution totals",
    publicPullRequests: "Public pull requests",
    contributionsTitle: "Open-source contributions",
    repositories: "repositories",
    mergedPullRequests: "merged PRs",
    spokenLanguages: "Spoken languages",
    technologiesForProject: (title) => `Technologies used for ${title}`,
    technologiesForExperience: (company) => `Technologies used at ${company}`,
    technologiesForContribution: (repository) =>
      `Technologies used in contributions to ${repository}`,
    skillsForGroup: (title) => `${title} skills`,
  },
} satisfies ProfileContent;

export const sections = {
  career: { id: "career", title: "Career", tone: "paper" },
  professional: { id: "professional", title: "Professional projects", tone: "green" },
  openSource: { id: "open-source", title: "Open source", tone: "paper" },
  research: { id: "research", title: "Research", tone: "green" },
  awards: { id: "awards", title: "Awards", tone: "paper" },
  skills: { title: "Skills", tone: "green" },
  languages: { title: "Languages", tone: "paper" },
} satisfies Record<string, SectionDefinition>;
