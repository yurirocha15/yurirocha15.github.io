export type LinkLocation = "hero" | "footer" | "project";

export type Locale = "en" | "ko" | "pt-BR";

export type Link = {
  id: string;
  label: string;
  href: string;
  locations: readonly LinkLocation[];
  primary?: boolean;
  hideOnMobile?: boolean;
};

export type NavigationItem = {
  id: string;
  label: string;
  targetId: string;
};

export type TagGroup = {
  id: string;
  title: string;
  items: readonly string[];
};

export type Experience = {
  id: string;
  period: string;
  role: string;
  company: string;
  detail: string;
  bullets: readonly string[];
  tags: readonly string[];
};

export type ProjectVisualKey =
  | "controller-runtime"
  | "gpu-platform"
  | "palletizer"
  | "smart-frame"
  | "edge-llm"
  | "mcp"
  | "topic"
  | "leetcode"
  | "kims";

export type ProjectLayout = "standard" | "featured" | "wide-visual" | "wide-balanced";

export type Project = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  bullets: readonly string[];
  tags: readonly string[];
  visual: ProjectVisualKey;
  layout: ProjectLayout;
  links?: readonly Link[];
};

export type Contribution = {
  id: string;
  repository: string;
  description: string;
  href: string;
  linkLabel: string;
  mergedPrCount: number;
  tags: readonly string[];
};

export type Publication = {
  id: string;
  year: string;
  title: string;
  venue: string;
  href: string;
};

export type Award = {
  id: string;
  year: string;
  title: string;
  detail: string;
};

export type Language = {
  id: string;
  name: string;
  flag: string;
};

export type SectionTone = "paper" | "green";

export type SectionDefinition = {
  id?: string;
  title: string;
  tone: SectionTone;
};

export type PortfolioLabels = {
  mainNavigation: string;
  openMenu: string;
  closeMenu: string;
  languageSelector: string;
  switchToEnglish: string;
  switchToKorean: string;
  switchToPortuguese: string;
  primaryLinks: string;
  roleAndLocation: string;
  engineeringCapabilities: string;
  contributionTotals: string;
  publicPullRequests: string;
  contributionsTitle: string;
  repositories: string;
  mergedPullRequests: string;
  spokenLanguages: string;
  technologiesForProject: (title: string) => string;
  technologiesForExperience: (company: string) => string;
  technologiesForContribution: (repository: string) => string;
  skillsForGroup: (title: string) => string;
};

export type PortfolioMetadata = {
  title: string;
  description: string;
};

export type PortfolioVisualLabels = {
  sceneFallback: {
    title: string;
    description: string;
  };
  controllerRuntime: {
    realTimeController: string;
    agenticWorkflow: string;
    agentInterface: string;
    taskManager: string;
    tasks: readonly [string, string, string, string];
    robotHardware: string;
  };
  gpuPlatform: {
    deploymentPlatform: string;
    llmServing: string;
    simulation: string;
    monitoring: string;
    kubernetesCluster: string;
    deploymentStatus: string;
    clusterHealthy: string;
    deployment: string;
    replicas: string;
    status: string;
    ready: string;
    deploying: string;
  };
  edgeLlm: {
    onDevice: string;
    edge: string;
    inference: string;
  };
  mcp: {
    cppApplication: string;
    nativeRuntime: string;
    robotApi: string;
    planner: string;
    telemetry: string;
    typedCalls: string;
    tools: string;
    resources: string;
    agent: string;
  };
  topic: {
    containerResources: string;
    relativeToLimits: string;
    cpu: string;
    memory: string;
    gpu: string;
    cgroupLimit: string;
  };
  leetcode: {
    problem: string;
    description: string;
    examples: string;
    accepted: string;
    pythonScraper: string;
    gitRepository: string;
  };
  kims: {
    vectorizedEnvironments: string;
  };
};

export type ProfileContent = {
  skipLinkLabel: string;
  identity: {
    name: string;
    title: string;
    homeLabel: string;
  };
  navigation: readonly NavigationItem[];
  links: readonly Link[];
  hero: {
    metadata: readonly string[];
    heading: string;
    lead: string;
  };
  engineeringProfile: {
    label: string;
    title: string;
    groups: readonly TagGroup[];
  };
  contact: {
    eyebrow: string;
    location: string;
    email: string;
    emailHref: string;
  };
  labels: PortfolioLabels;
};

export type PortfolioContent = {
  locale: Locale;
  metadata: PortfolioMetadata;
  profile: ProfileContent;
  sections: {
    career: SectionDefinition;
    professional: SectionDefinition;
    openSource: SectionDefinition;
    research: SectionDefinition;
    awards: SectionDefinition;
    skills: SectionDefinition;
    languages: SectionDefinition;
  };
  experience: readonly Experience[];
  professionalProjects: readonly Project[];
  openSourceProjects: readonly Project[];
  contributions: readonly Contribution[];
  publications: readonly Publication[];
  awards: readonly Award[];
  skills: readonly TagGroup[];
  languages: readonly Language[];
  visuals: PortfolioVisualLabels;
};
