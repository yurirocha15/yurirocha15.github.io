import type { ProfileContent, SectionDefinition } from "./types";

export const profile = {
  skipLinkLabel: "Skip to content",
  identity: {
    name: "Yuri Rocha",
    title: "Robotics Software · Physical AI",
    mark: "YR",
    homeLabel: "Yuri Rocha home",
  },
  navigation: [
    { id: "nav-career", label: "Career", targetId: "career" },
    { id: "nav-professional", label: "Professional", targetId: "professional" },
    { id: "nav-open-source", label: "Open Source", targetId: "open-source" },
    { id: "nav-research", label: "Research", targetId: "research" },
    { id: "nav-skills", label: "Skills", targetId: "skills" },
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
      href: "./cv/yuri-rocha-cv-en.pdf",
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
    metadata: ["Senior Robotics Software Engineer", "C++ · ROS 2 · Linux", "Seoul, South Korea"],
    heading: "Building reliable software for Physical AI.",
    lead:
      "I architect real-time robot-controller software and interfaces for agentic workflows on collaborative robots. My work also spans industrial motion planning, model-level AI optimization, and Kubernetes-based LLMOps and simulation infrastructure.",
  },
  engineeringProfile: {
    label: "Engineering profile",
    title: "Software architecture for robotics and Physical AI",
    groups: [
      {
        id: "capability-robot-software",
        title: "Robot Software",
        items: ["C++", "Linux", "ROS / ROS 2", "MoveIt", "OMPL"],
      },
      {
        id: "capability-ml",
        title: "ML & Model Optimization",
        items: ["Python", "PyTorch", "ONNX", "LLMs", "Quantization"],
      },
      {
        id: "capability-infrastructure",
        title: "Infrastructure",
        items: ["Kubernetes", "Docker", "GitHub Actions", "CI/CD", "LLMOps"],
      },
      {
        id: "capability-simulation",
        title: "Robotics Simulation & Learning",
        items: ["Isaac Sim", "MuJoCo", "Unity3D", "Gazebo", "Reinforcement Learning"],
      },
    ],
  },
  proofItems: [
    {
      id: "proof-current",
      label: "Current work",
      detail: "Real-time controller architecture with agent-first integration",
    },
    {
      id: "proof-industrial",
      label: "Industrial automation",
      detail: "Robot-programming workflow reduced from six weeks to three days",
    },
    {
      id: "proof-open-source",
      label: "Open source",
      detail: "C++20 SDK for the Model Context Protocol",
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
    engineeringCapabilities: "Robotics software and Physical AI capabilities",
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
  skills: { id: "skills", title: "Skills", tone: "green" },
  languages: { title: "Languages", tone: "paper" },
} satisfies Record<string, SectionDefinition>;
