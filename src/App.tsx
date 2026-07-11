import { lazy, Suspense, useEffect } from "react";
import ProjectVisual, { type ProjectVisualKind } from "./ProjectVisuals";

const HeroRobotScene = lazy(() => import("./HeroRobotScene"));

type LinkItem = {
  label: string;
  href: string;
};

type ExperienceItem = {
  period: string;
  role: string;
  company: string;
  detail: string;
  bullets: string[];
  tags: string[];
};

type ProjectItem = {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  tags: string[];
  visual: ProjectVisualKind;
  links?: LinkItem[];
};

type PaperItem = {
  year: string;
  title: string;
  venue: string;
  href: string;
};

type AwardItem = {
  year: string;
  title: string;
  detail: string;
};

type ContributionItem = {
  repository: string;
  description: string;
  href: string;
  linkLabel: string;
  tags: string[];
};

type TagListProps = {
  items: string[];
  className?: string;
  label?: string;
};

const links: LinkItem[] = [
  { label: "GitHub", href: "https://github.com/yurirocha15" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/yurirocha15/" },
  { label: "CV", href: "/assets/cv_yuri_website.pdf" },
  { label: "Email", href: "mailto:yurirocha15@gmail.com" },
];

const capabilityGroups = [
  { title: "Real-time", items: ["C++", "Linux", "Task Scheduling", "IPC"] },
  { title: "Robotics", items: ["ROS 2", "Robot Controllers", "Motion Planning"] },
  { title: "AI systems", items: ["LLMs", "ONNX", "Edge Inference", "GPU Inference"] },
  { title: "Infrastructure", items: ["Kubernetes", "APIs", "Isaac Sim", "MuJoCo"] },
];

const experience: ExperienceItem[] = [
  {
    period: "2025 - now",
    role: "Senior Software Engineer, AI & Software",
    company: "Doosan Robotics",
    detail:
      "Real-time robot controller software, official developer APIs, and an internal AI/simulation deployment platform.",
    bullets: [
      "Developing controller-side C++ for TCP/UDP interfaces, task management, IPC, and RT/NRT data flows.",
      "Built the web UI, service APIs, and Kubernetes orchestration for deploying LLMs, Isaac Sim, and MuJoCo workloads, with cluster monitoring and GPU utilization visibility.",
      "Creating interfaces for agentic robot control and harnesses for robotic applications.",
      "Maintaining official C++ APIs and ROS packages for robot application developers.",
    ],
    tags: ["C++", "Real-Time", "TCP/UDP", "IPC", "ROS 2", "Kubernetes", "Agentic Control", "GPU"],
  },
  {
    period: "2020 - 2025",
    role: "Robotics and Machine Learning Research Engineer",
    company: "MakinaRocks",
    detail:
      "Industrial OLP automation, scalable planning services, and mobile NPU inference optimization.",
    bullets: [
      "Led software architecture for an industrial OLP system spanning planning, evaluation, and deployment.",
      "Built highly parallelized C++ planning and evaluation algorithms for factory automation constraints.",
      "Operated Kubernetes infrastructure for scalable OLP deployment and production-facing workflows.",
      "Built ONNX graph optimization and performance evaluation pipelines for edge NPU LLM work.",
    ],
    tags: ["OLP", "C++", "Kubernetes", "ONNX", "LLMs", "NPU"],
  },
  {
    period: "2018 - 2020",
    role: "Researcher",
    company: "Sungkyunkwan University, Control and Robotics Lab",
    detail:
      "Research on robot world models, semantic navigation, mental simulation, and autonomous planning.",
    bullets: [
      "Developed Semantic SLAM and ontology-based environment models for autonomous navigation.",
      "Published and implemented mental-simulation workflows for robot learning and planning.",
    ],
    tags: ["Semantic SLAM", "Motion Planning", "Simulation", "Deep Learning"],
  },
  {
    period: "2016 - 2017",
    role: "Software Developer",
    company: "Moringa Digital",
    detail: "ERP integration and web/mobile application development.",
    bullets: [
      "Built Node.js services that connected application workflows to ERP systems.",
    ],
    tags: ["Node.js", "APIs", "Integration"],
  },
];

const professionalProjects: ProjectItem[] = [
  {
    eyebrow: "Robot controller at Doosan Robotics",
    title: "Real-time robot controller software",
    description:
      "Controller-side C++ that coordinates communication and data flow across real-time and non-real-time components.",
    visual: "controller-runtime",
    bullets: [
      "TCP/UDP interfaces, task lifecycle management, and inter-process communication.",
      "RT/NRT data paths designed around timing, isolation, and dependable state exchange.",
    ],
    tags: ["C++", "Linux", "Real-Time", "TCP/UDP", "IPC"],
  },
  {
    eyebrow: "Internal AI platform at Doosan Robotics",
    title: "On-prem AI and simulation deployment platform",
    description:
      "Full-stack platform for deploying LLM services and Isaac Sim or MuJoCo environments on an on-premises Kubernetes GPU cluster.",
    visual: "gpu-platform",
    bullets: [
      "Combined workload deployment, cluster monitoring, and GPU utilization visibility in one operating interface.",
    ],
    tags: ["Kubernetes", "APIs", "LLMs", "Isaac Sim", "MuJoCo", "GPU"],
  },
  {
    eyebrow: "Industrial automation at MakinaRocks",
    title: "Offline planning for automotive welding lines",
    description:
      "Architected the planning system and parallel C++ algorithms used to configure industrial robot cells, reducing planning work from roughly 6 weeks to 3 days.",
    visual: "smart-frame",
    bullets: [
      "Constraint evaluation and task allocation for multi-robot stations.",
      "Kubernetes services for scaling planning runs and delivery workflows.",
    ],
    tags: ["C++", "Parallel Algorithms", "Motion Planning", "OLP", "Kubernetes"],
  },
  {
    eyebrow: "Team Zenith, NVIDIA Cosmos Cookoff",
    title: "Explainable mixed palletizing",
    description:
      "An end-to-end palletizing system that inspects boxes from camera images, rejects damaged items, and adapts grip strength, motion speed, and placement to inferred contents, weight, and fragility.",
    visual: "palletizer",
    bullets: [
      "Fine-tuned Cosmos Reason2 with LoRA on synthetic data and connected its decisions to Isaac Sim and cuRobo through four containerized services.",
      "First place in a hackathon with more than 1,600 participants worldwide.",
    ],
    tags: ["Python", "Cosmos Reason2", "LoRA", "Isaac Sim", "cuRobo", "vLLM", "Docker"],
    links: [
      {
        label: "GitHub",
        href: "https://github.com/doosan-robotics/explainable-palletizer",
      },
      {
        label: "NVIDIA result",
        href: "https://forums.developer.nvidia.com/t/the-results-are-in-meet-the-nvidia-cosmos-cookoff-winners-see-them-live-on-april-16/366130",
      },
    ],
  },
  {
    eyebrow: "On-device inference for mobile NPUs",
    title: "LLM optimization for mobile NPUs",
    description:
      "Built ONNX graph optimization and evaluation pipelines for running LLMs on constrained mobile NPUs.",
    visual: "edge-llm",
    bullets: [
      "Measured latency, throughput, and regressions across runtime and graph changes.",
      "Optimized MoE and Mamba models and improved KV-cache efficiency for transformer workloads.",
    ],
    tags: [
      "ONNX",
      "LLMs",
      "MoE",
      "Mamba",
      "Efficient KV Caching",
      "Mobile NPU",
      "Quantization",
      "Performance",
    ],
  },
];

const openSourceProjects: ProjectItem[] = [
  {
    eyebrow: "C++20 protocol tooling",
    title: "mcp-cpp-sdk",
    description:
      "A C++20 SDK for connecting native C++ applications to AI agents through MCP tools, resources, and transport backends.",
    visual: "mcp",
    bullets: [
      "Supports stdio, WebSocket, and Streamable HTTP transports.",
    ],
    tags: ["C++20", "Boost.Asio", "Coroutines", "WebSocket", "HTTP"],
    links: [
      { label: "GitHub", href: "https://github.com/yurirocha15/mcp-cpp-sdk" },
      { label: "Docs", href: "https://yurirocha15.github.io/mcp-cpp-sdk" },
    ],
  },
  {
    eyebrow: "Go container operations",
    title: "topic",
    description:
      "A terminal monitor that shows resource usage the way containerized software actually experiences it.",
    visual: "topic",
    bullets: [
      "CPU and memory relative to cgroup limits, not just host totals.",
      "Docker, Kubernetes, NVIDIA/NVML, terminal controls, and JSON snapshots.",
    ],
    tags: ["Go", "Linux", "cgroups", "Docker", "Kubernetes", "NVML"],
    links: [{ label: "GitHub", href: "https://github.com/yurirocha15/topic" }],
  },
  {
    eyebrow: "Python web scraping",
    title: "leet2git",
    description:
      "Web scraper and CLI that uses an authenticated LeetCode browser session to import problems and accepted submissions into a structured Git repository.",
    visual: "leetcode",
    bullets: [
      "Generates source files, Python tests, and README indexes from scraped problem data.",
    ],
    tags: ["Python", "Web Scraping", "CLI", "Git", "Testing"],
    links: [{ label: "GitHub", href: "https://github.com/yurirocha15/leetcode2github" }],
  },
  {
    eyebrow: "Collaborative reinforcement learning education",
    title: "Isaac Sim reinforcement learning curriculum",
    description:
      "Core developer of a public, hands-on reinforcement learning curriculum for the Korea Institute of Materials Science.",
    visual: "kims",
    bullets: [
      "Built PPO cart-pole exercises from a single simulation to vectorized Isaac Sim training.",
      "Integrated Stable-Baselines3 and RL-Games examples into the shared course codebase.",
    ],
    tags: ["Python", "Isaac Sim", "Reinforcement Learning", "PPO", "Stable-Baselines3", "RL-Games"],
    links: [{ label: "GitHub", href: "https://github.com/rl-education/kims" }],
  },
];

const openSourceContributions: ContributionItem[] = [
  {
    repository: "ompl/ompl",
    description:
      "Fixed AIT* and EIT* sampling, graph validity, termination, and clear-before-setup failures; added intermediate-solution callbacks.",
    href: "https://github.com/ompl/ompl/pulls?q=is%3Apr+is%3Amerged+author%3Ayurirocha15",
    linkLabel: "5 merged PRs",
    tags: ["C++", "Motion Planning", "OMPL"],
  },
  {
    repository: "moveit/moveit",
    description:
      "Fixed Bullet collision world copying and contact typing with regression tests, and corrected RViz box-axis ordering.",
    href: "https://github.com/moveit/moveit/pulls?q=is%3Apr+is%3Amerged+author%3Ayurirocha15",
    linkLabel: "3 merged PRs",
    tags: ["C++", "MoveIt", "Bullet", "RViz"],
  },
  {
    repository: "ray-project/ray",
    description:
      "Fixed RLlib Unity environment port allocation across parallel workers and added unit coverage for default and custom ports.",
    href: "https://github.com/ray-project/ray/pull/13519",
    linkLabel: "Merged PR #13519",
    tags: ["Python", "RLlib", "Unity", "Testing"],
  },
  {
    repository: "ros-infrastructure/rosdoc_lite",
    description:
      "Ported URL handling to Python 3 and fixed bytes decoding when writing Doxygen tagfiles.",
    href: "https://github.com/ros-infrastructure/rosdoc_lite/pulls?q=is%3Apr+is%3Amerged+author%3Ayurirocha15",
    linkLabel: "2 merged PRs",
    tags: ["Python", "ROS", "Doxygen"],
  },
  {
    repository: "DFKI-NI/rospy_message_converter",
    description:
      "Added configurable log levels and propagated them through nested ROS message and array conversion.",
    href: "https://github.com/DFKI-NI/rospy_message_converter/pulls?q=is%3Apr+is%3Amerged+author%3Ayurirocha15",
    linkLabel: "2 merged PRs",
    tags: ["Python", "ROS", "Logging"],
  },
  {
    repository: "odygrd/quill",
    description:
      "Fixed older-GCC compilation when Quill's bundled fmt is used alongside Boost.SML operator overloads.",
    href: "https://github.com/odygrd/quill/pull/878",
    linkLabel: "Merged PR #878",
    tags: ["C++", "GCC", "Boost.SML"],
  },
  {
    repository: "neka-nat/gazebo_domain_randomization",
    description:
      "Published runtime visual updates through Gazebo Transport so ROS cameras observe domain-randomized colors.",
    href: "https://github.com/neka-nat/gazebo_domain_randomization/pull/5",
    linkLabel: "Merged PR #5",
    tags: ["C++", "Gazebo", "ROS"],
  },
  {
    repository: "captain-yoshi/moveit_serialization",
    description: "Fixed CMake installation of C++ headers for downstream consumers.",
    href: "https://github.com/captain-yoshi/moveit_serialization/pull/9",
    linkLabel: "Merged PR #9",
    tags: ["C++", "CMake", "MoveIt"],
  },
  {
    repository: "cielavenir/openrave-installation",
    description:
      "Integrated pybind11 patches that restore OpenRAVE inverse-kinematics generation.",
    href: "https://github.com/cielavenir/openrave-installation/pull/1",
    linkLabel: "Merged PR #1",
    tags: ["Python", "OpenRAVE", "pybind11"],
  },
];

const papers: PaperItem[] = [
  {
    year: "2020",
    title:
      "Autonomous Navigation Framework for Intelligent Robots Based on a Semantic Environment Modeling",
    venue: "Applied Sciences",
    href: "https://www.mdpi.com/2076-3417/10/9/3219/pdf",
  },
  {
    year: "2020",
    title:
      "Mental Simulation for Autonomous Learning and Planning Using an Ontology-Based Modeling Framework",
    venue: "M.Sc. thesis, Sungkyunkwan University",
    href: "/assets/Yuri_Master_Thesis.pdf",
  },
  {
    year: "2019",
    title:
      "Mental Simulation for Autonomous Learning and Planning Based on Triplet Ontological Semantic Model",
    venue: "CEUR Workshop Proceedings",
    href: "/assets/Mental_Simulation_IROS_2019.pdf",
  },
  {
    year: "2019",
    title:
      "Automatic Generation of a Simulated Robot from an Ontology-Based Semantic Description",
    venue: "ICCAS",
    href: "/assets/Automatic_Generation_ICCAS2019.pdf",
  },
  {
    year: "2017",
    title:
      "Design of Singularity-Robust and Task-Priority Primitive Controllers for Cooperative Manipulation",
    venue: "IEEE CCTA",
    href: "/assets/Design-of-singularity-robust-and-task-priority-primitive-controllers_CCTA_2017.pdf",
  },
];

const skillGroups = [
  {
    title: "Robotics",
    items: ["ROS 2", "Motion Planning", "Industrial Robots", "Collaborative Robots", "Autonomous Navigation"],
  },
  {
    title: "Systems",
    items: ["C++", "Real-Time", "TCP/UDP", "IPC", "Linux", "Parallel Algorithms", "Performance Profiling"],
  },
  {
    title: "AI",
    items: ["Python", "PyTorch", "LLMs", "ONNX", "MoE", "Mamba", "Quantization", "Edge Inference", "NPU Optimization", "Visual Reasoning"],
  },
  {
    title: "Infrastructure",
    items: ["Go", "Kubernetes", "Docker", "LLM Serving", "CI/CD", "MLOps", "Ansible", "Release Operations"],
  },
];

const spokenLanguages = ["🇧🇷 Portuguese", "🇺🇸 English", "🇰🇷 Korean", "🇫🇷 French"];

const awards: AwardItem[] = [
  {
    year: "2026",
    title: "NVIDIA Cosmos Cookoff",
    detail: "First place with Team Zenith among more than 1,600 hackathon participants worldwide",
  },
  {
    year: "2019",
    title: "Academic Achievement Award",
    detail: "Korean Government Scholarship Program",
  },
  {
    year: "2017",
    title: "Korean Government Scholarship Program",
    detail: "Graduate scholarship recipient",
  },
  {
    year: "2016",
    title: "Latin American Robotics Competition",
    detail:
      "Standard Platform League first place with UnBeatables in Latin America's humanoid robot football competition",
  },
  {
    year: "2016",
    title: "RoboCup Standard Platform League",
    detail: "Best Drop-in Only Team with UnBeatables in the worldwide humanoid robot football competition",
  },
];

function TagList({ items, className = "", label }: TagListProps) {
  return (
    <div className={`tag-list ${className}`.trim()} aria-label={label}>
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

function useScrollReveal() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );

    elements.forEach((element) => observer.observe(element));

    let revealFrame = 0;
    const revealInViewport = () => {
      revealFrame = 0;
      const viewportTop = window.innerHeight * 0.04;
      const viewportBottom = window.innerHeight * 0.94;

      elements.forEach((element) => {
        if (element.classList.contains("is-visible")) return;
        const bounds = element.getBoundingClientRect();
        if (bounds.bottom > viewportTop && bounds.top < viewportBottom) {
          element.classList.add("is-visible");
          observer.unobserve(element);
        }
      });
    };
    const scheduleViewportCheck = () => {
      if (revealFrame) return;
      revealFrame = window.requestAnimationFrame(revealInViewport);
    };

    scheduleViewportCheck();
    const restorationCheck = window.setTimeout(scheduleViewportCheck, 180);
    window.addEventListener("scroll", scheduleViewportCheck, { passive: true });
    window.addEventListener("hashchange", scheduleViewportCheck);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(revealFrame);
      window.clearTimeout(restorationCheck);
      window.removeEventListener("scroll", scheduleViewportCheck);
      window.removeEventListener("hashchange", scheduleViewportCheck);
    };
  }, []);
}

function useVisualActivity() {
  useEffect(() => {
    const visuals = Array.from(document.querySelectorAll<HTMLElement>(".project-visual"));

    if (!("IntersectionObserver" in window)) {
      visuals.forEach((visual) => visual.classList.add("is-active"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("is-active", entry.isIntersecting);
        });
      },
      { rootMargin: "160px 0px", threshold: 0.01 },
    );

    visuals.forEach((visual) => observer.observe(visual));
    return () => observer.disconnect();
  }, []);
}

function App() {
  useScrollReveal();
  useVisualActivity();

  return (
    <div className="site-shell">
      <a className="skip-link" href="#top">
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Yuri Rocha home">
          <span className="brand-mark">YR</span>
          <span>
            <strong>Yuri Rocha</strong>
            <small>Robotics & AI Engineer</small>
          </span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#career">Career</a>
          <a href="#professional">Professional</a>
          <a href="#open-source">Open Source</a>
          <a href="#research">Research</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="top" tabIndex={-1}>
        <section className="hero section-band">
          <div className="hero-copy" data-reveal>
            <TagList
              items={["Senior Robotics Software Engineer", "Seoul, South Korea"]}
              className="hero-meta"
              label="Role and location"
            />
            <h1>Performant, intelligent robot software.</h1>
            <p className="lead">
              I build real-time robot controllers, motion-planning systems, on-device
              inference, and GPU-backed deployment platforms for robotics teams.
            </p>
            <div className="hero-actions" aria-label="Primary links">
              {links.map((link, index) => (
                <a
                  className={index === 0 ? "button button-primary" : "button"}
                  href={link.href}
                  key={link.label}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div
            className="planning-board"
            aria-label="Robotics software engineering capabilities"
            data-reveal
          >
            <div className="board-header">
              <span>Engineering profile</span>
              <strong>Robotics software engineer</strong>
            </div>
            <Suspense fallback={<div className="robot-scene-panel robot-scene-fallback" />}>
              <HeroRobotScene />
            </Suspense>
            <dl className="board-metrics">
              {capabilityGroups.map((group) => (
                <div key={group.title}>
                  <dt>{group.title}</dt>
                  <dd>
                    <TagList items={group.items} className="capability-tags" />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="section-band proof-strip" aria-label="Professional snapshot">
          <div className="proof-item" data-reveal>
            <span>Current</span>
            <strong>Real-time robot controller and on-prem AI deployment platform</strong>
          </div>
          <div className="proof-item" data-reveal>
            <span>Hackathon win</span>
            <strong>2026 NVIDIA Cosmos Cookoff, first place among 1,600+ participants</strong>
          </div>
          <div className="proof-item" data-reveal>
            <span>Latest open-source project</span>
            <strong>mcp-cpp-sdk: a C++20 SDK connecting native software to AI agents</strong>
          </div>
        </section>

        <section className="section-grid" id="career">
          <div className="section-label" data-reveal>
            <h2 className="section-heading">Career</h2>
          </div>
          <div className="timeline section-content">
            {experience.map((item) => (
              <article className="timeline-item" key={`${item.company}-${item.period}`} data-reveal>
                <div className="timeline-period">{item.period}</div>
                <div className="timeline-body">
                  <p className="role">{item.role}</p>
                  <h3>{item.company}</h3>
                  <p className="timeline-detail">{item.detail}</p>
                  <ul>
                    {item.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                  <TagList
                    items={item.tags}
                    className="tag-row"
                    label={`Technologies used at ${item.company}`}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section-grid" id="professional">
          <div className="section-label" data-reveal>
            <h2 className="section-heading">Professional projects</h2>
          </div>
          <div className="project-grid section-content">
            {professionalProjects.map((project) => (
              <article
                className={`project-card project-card-${project.visual}`}
                key={project.title}
                data-reveal
              >
                <ProjectVisual kind={project.visual} />
                <div className="project-copy">
                  <p className="project-eyebrow">{project.eyebrow}</p>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <ul>
                    {project.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                  <TagList
                    items={project.tags}
                    className="project-stack"
                    label={`Technologies used for ${project.title}`}
                  />
                  {project.links?.length ? (
                    <div className="text-links">
                      {project.links.map((link) => (
                        <a href={link.href} key={link.label}>
                          {link.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section-grid" id="open-source">
          <div className="section-label" data-reveal>
            <h2 className="section-heading">Open source</h2>
          </div>
          <div className="open-source-content section-content">
            <div className="project-grid open-source-grid">
              {openSourceProjects.map((project) => (
                <article
                  className={`project-card project-card-${project.visual}`}
                  key={project.title}
                  data-reveal
                >
                  <ProjectVisual kind={project.visual} />
                  <div className="project-copy">
                    <p className="project-eyebrow">{project.eyebrow}</p>
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <ul>
                      {project.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                    <TagList
                      items={project.tags}
                      className="project-stack"
                      label={`Technologies used for ${project.title}`}
                    />
                    {project.links?.length ? (
                      <div className="text-links">
                        {project.links.map((link) => (
                          <a href={link.href} key={link.label}>
                            {link.label}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>

            <div className="open-source-contributions" aria-labelledby="contributions-title">
              <div className="contribution-header" data-reveal>
                <div>
                  <p className="eyebrow">Public pull requests</p>
                  <h3 id="contributions-title">Open-source contributions</h3>
                </div>
                <div className="contribution-summary" aria-label="Contribution totals">
                  <span><strong>9</strong> repositories</span>
                  <span><strong>17</strong> merged PRs</span>
                </div>
              </div>
              <div className="contribution-list">
                {openSourceContributions.map((contribution) => (
                  <article className="contribution-row" key={contribution.repository} data-reveal>
                    <div className="contribution-source">
                      <strong>{contribution.repository}</strong>
                      <a href={contribution.href}>{contribution.linkLabel}</a>
                    </div>
                    <p>{contribution.description}</p>
                    <TagList
                      items={contribution.tags}
                      className="contribution-tags"
                      label={`Technologies used in contributions to ${contribution.repository}`}
                    />
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section-grid" id="research">
          <div className="section-label" data-reveal>
            <h2 className="section-heading">Research</h2>
          </div>
          <div className="paper-list section-content">
            {papers.map((paper) => (
              <a className="paper-row" href={paper.href} key={paper.title} data-reveal>
                <span>{paper.year}</span>
                <strong>{paper.title}</strong>
                <em>{paper.venue}</em>
              </a>
            ))}
          </div>
        </section>

        <section className="section-grid" id="awards">
          <div className="section-label" data-reveal>
            <h2 className="section-heading">Awards</h2>
          </div>
          <div className="paper-list section-content">
            {awards.map((award) => (
              <article className="paper-row award-row" key={`${award.year}-${award.title}`} data-reveal>
                <span>{award.year}</span>
                <strong>{award.title}</strong>
                <em>{award.detail}</em>
              </article>
            ))}
          </div>
        </section>

        <section className="section-grid">
          <div className="section-label" data-reveal>
            <h2 className="section-heading">Skills</h2>
          </div>
          <div className="skills-grid section-content">
            {skillGroups.map((group) => (
              <article className="skill-block" key={group.title} data-reveal>
                <h3>{group.title}</h3>
                <TagList
                  items={group.items}
                  className="skill-tags"
                  label={`${group.title} skills`}
                />
              </article>
            ))}
          </div>
        </section>

        <section className="section-grid">
          <div className="section-label" data-reveal>
            <h2 className="section-heading">Languages</h2>
          </div>
          <div className="section-content language-panel" data-reveal>
            <TagList items={spokenLanguages} className="language-tags" label="Spoken languages" />
          </div>
        </section>
      </main>

      <footer className="site-footer" id="contact">
        <div data-reveal>
          <p className="eyebrow">Contact</p>
          <h2>Seoul, South Korea</h2>
          <a href="mailto:yurirocha15@gmail.com">yurirocha15@gmail.com</a>
        </div>
        <div className="footer-links" data-reveal>
          {links.slice(0, 4).map((link) => (
            <a href={link.href} key={link.label}>
              {link.label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default App;
