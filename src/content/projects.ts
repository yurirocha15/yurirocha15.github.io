import type { Contribution, Project } from "./types";

export const professionalProjects = [
  {
    id: "robot-controller-core",
    eyebrow: "Robot controller at Doosan Robotics",
    title: "Real-time robot controller core",
    description:
      "Core real-time software for high-performance robotic controllers, including task-management and data-flow architecture.",
    visual: "controller-runtime",
    layout: "standard",
    bullets: [
      "Architecting task management and data flow across the controller core.",
      "Developing software interfaces and harnesses for agentic workflows that interact with real robots.",
      "Leading releases and maintenance for official C++ APIs and ROS packages.",
    ],
    tags: ["C++", "Real-time Linux", "Software Architecture", "Agentic Workflows", "ROS 2", "Developer APIs"],
  },
  {
    id: "development-infrastructure",
    eyebrow: "Development platform at Doosan Robotics",
    title: "Kubernetes platform for LLMs and simulation",
    description:
      "A developer-facing web platform for deploying LLMs and simulation environments on the internal Kubernetes cluster and monitoring workload metrics.",
    visual: "gpu-platform",
    layout: "standard",
    bullets: [
      "Self-service deployment of LLM and robotics-simulation environments.",
      "Workload metrics available through the same operating interface.",
      "Supported by internal cluster operations and CI/CD and LLMOps pipelines.",
    ],
    tags: ["Kubernetes", "LLMOps", "CI/CD", "Simulation", "Monitoring", "Web Platform"],
  },
  {
    id: "automated-robot-programming",
    eyebrow: "Industrial automation at MakinaRocks",
    title: "Automated robot programming for welding lines",
    description:
      "Led the architecture of an automated robot-programming system for spot-welding lines containing hundreds of robots, reducing the workflow from six weeks to three days.",
    visual: "smart-frame",
    layout: "wide-visual",
    bullets: [
      "Parallel C++ planning for work-point validation, trajectory generation and evaluation, task distribution, and collision-aware coordination.",
      "ROS, MoveIt, OMPL, and MongoDB algorithms backed by scalable Kubernetes and Docker planning infrastructure.",
    ],
    tags: ["C++", "ROS", "MoveIt", "OMPL", "MongoDB", "Kubernetes", "Docker"],
  },
  {
    id: "explainable-palletizer",
    eyebrow: "Team Zenith, NVIDIA Cosmos Cookoff",
    title: "Explainable mixed palletizing",
    description:
      "An end-to-end palletizing system that inspects boxes from camera images, rejects damaged items, and adapts grip strength, motion speed, and placement to inferred contents, weight, and fragility.",
    visual: "palletizer",
    layout: "standard",
    bullets: [
      "Fine-tuned Cosmos Reason2 with LoRA on synthetic data and connected its decisions to Isaac Sim and cuRobo through four containerized services.",
      "First place in a hackathon with more than 1,600 participants worldwide.",
    ],
    tags: ["Python", "Cosmos Reason2", "LoRA", "Isaac Sim", "cuRobo", "vLLM", "Docker"],
    links: [
      {
        id: "palletizer-github",
        label: "GitHub",
        href: "https://github.com/doosan-robotics/explainable-palletizer",
        locations: ["project"],
      },
      {
        id: "palletizer-result",
        label: "NVIDIA result",
        href: "https://forums.developer.nvidia.com/t/the-results-are-in-meet-the-nvidia-cosmos-cookoff-winners-see-them-live-on-april-16/366130",
        locations: ["project"],
      },
    ],
  },
  {
    id: "model-level-llm-optimization",
    eyebrow: "One-year machine-learning assignment at MakinaRocks",
    title: "Model-level LLM optimization for mobile inference",
    description:
      "Optimized LLM architectures and ONNX graphs at the model and graph levels for mobile edge targets.",
    visual: "edge-llm",
    layout: "standard",
    bullets: [
      "Built PyTorch/ONNX workflows for graph optimization, quantization, and repeatable performance evaluation.",
      "The work focused on model and graph optimization, not low-level NPU software.",
    ],
    tags: ["PyTorch", "ONNX", "LLMs", "Quantization", "Model Optimization", "Mobile Inference"],
  },
] satisfies readonly Project[];

export const openSourceProjects = [
  {
    id: "mcp-cpp-sdk",
    eyebrow: "C++20 protocol tooling",
    title: "mcp-cpp-sdk",
    description:
      "A C++20 SDK for connecting native C++ applications to AI agents through MCP tools, resources, and transport backends.",
    visual: "mcp",
    layout: "featured",
    bullets: ["Supports stdio, WebSocket, and Streamable HTTP transports."],
    tags: ["C++20", "Boost.Asio", "Coroutines", "WebSocket", "HTTP"],
    links: [
      {
        id: "mcp-github",
        label: "GitHub",
        href: "https://github.com/yurirocha15/mcp-cpp-sdk",
        locations: ["project"],
      },
      {
        id: "mcp-docs",
        label: "Docs",
        href: "https://yurirocha15.github.io/mcp-cpp-sdk",
        locations: ["project"],
      },
    ],
  },
  {
    id: "topic",
    eyebrow: "Go container operations",
    title: "topic",
    description:
      "A terminal monitor that shows resource usage the way containerized software actually experiences it.",
    visual: "topic",
    layout: "standard",
    bullets: [
      "CPU and memory relative to cgroup limits, not just host totals.",
      "Docker, Kubernetes, NVIDIA/NVML, terminal controls, and JSON snapshots.",
    ],
    tags: ["Go", "Linux", "cgroups", "Docker", "Kubernetes", "NVML"],
    links: [
      {
        id: "topic-github",
        label: "GitHub",
        href: "https://github.com/yurirocha15/topic",
        locations: ["project"],
      },
    ],
  },
  {
    id: "leet2git",
    eyebrow: "Python web scraping",
    title: "leet2git",
    description:
      "Web scraper and CLI that uses an authenticated LeetCode browser session to import problems and accepted submissions into a structured Git repository.",
    visual: "leetcode",
    layout: "standard",
    bullets: [
      "Generates source files, Python tests, and README indexes from scraped problem data.",
    ],
    tags: ["Python", "Web Scraping", "CLI", "Git", "Testing"],
    links: [
      {
        id: "leet2git-github",
        label: "GitHub",
        href: "https://github.com/yurirocha15/leetcode2github",
        locations: ["project"],
      },
    ],
  },
  {
    id: "kims-rl-curriculum",
    eyebrow: "Collaborative reinforcement learning education",
    title: "Isaac Sim reinforcement learning curriculum",
    description:
      "Core developer of a public, hands-on reinforcement learning curriculum for the Korea Institute of Materials Science.",
    visual: "kims",
    layout: "wide-balanced",
    bullets: [
      "Built PPO cart-pole exercises from a single simulation to vectorized Isaac Sim training.",
      "Integrated Stable-Baselines3 and RL-Games examples into the shared course codebase.",
    ],
    tags: ["Python", "Isaac Sim", "Reinforcement Learning", "PPO", "Stable-Baselines3", "RL-Games"],
    links: [
      {
        id: "kims-github",
        label: "GitHub",
        href: "https://github.com/rl-education/kims",
        locations: ["project"],
      },
    ],
  },
] satisfies readonly Project[];

export const contributions = [
  {
    id: "ompl",
    repository: "ompl/ompl",
    description:
      "Fixed AIT* and EIT* sampling, graph validity, termination, and clear-before-setup failures; added intermediate-solution callbacks.",
    href: "https://github.com/ompl/ompl/pulls?q=is%3Apr+is%3Amerged+author%3Ayurirocha15",
    linkLabel: "5 merged PRs",
    mergedPrCount: 5,
    tags: ["C++", "Motion Planning", "OMPL"],
  },
  {
    id: "moveit",
    repository: "moveit/moveit",
    description:
      "Fixed Bullet collision world copying and contact typing with regression tests, and corrected RViz box-axis ordering.",
    href: "https://github.com/moveit/moveit/pulls?q=is%3Apr+is%3Amerged+author%3Ayurirocha15",
    linkLabel: "3 merged PRs",
    mergedPrCount: 3,
    tags: ["C++", "MoveIt", "Bullet", "RViz"],
  },
  {
    id: "ray",
    repository: "ray-project/ray",
    description:
      "Fixed RLlib Unity environment port allocation across parallel workers and added unit coverage for default and custom ports.",
    href: "https://github.com/ray-project/ray/pull/13519",
    linkLabel: "Merged PR #13519",
    mergedPrCount: 1,
    tags: ["Python", "RLlib", "Unity", "Testing"],
  },
  {
    id: "rosdoc-lite",
    repository: "ros-infrastructure/rosdoc_lite",
    description:
      "Ported URL handling to Python 3 and fixed bytes decoding when writing Doxygen tagfiles.",
    href: "https://github.com/ros-infrastructure/rosdoc_lite/pulls?q=is%3Apr+is%3Amerged+author%3Ayurirocha15",
    linkLabel: "2 merged PRs",
    mergedPrCount: 2,
    tags: ["Python", "ROS", "Doxygen"],
  },
  {
    id: "rospy-message-converter",
    repository: "DFKI-NI/rospy_message_converter",
    description:
      "Added configurable log levels and propagated them through nested ROS message and array conversion.",
    href: "https://github.com/DFKI-NI/rospy_message_converter/pulls?q=is%3Apr+is%3Amerged+author%3Ayurirocha15",
    linkLabel: "2 merged PRs",
    mergedPrCount: 2,
    tags: ["Python", "ROS", "Logging"],
  },
  {
    id: "quill",
    repository: "odygrd/quill",
    description:
      "Fixed older-GCC compilation when Quill's bundled fmt is used alongside Boost.SML operator overloads.",
    href: "https://github.com/odygrd/quill/pull/878",
    linkLabel: "Merged PR #878",
    mergedPrCount: 1,
    tags: ["C++", "GCC", "Boost.SML"],
  },
  {
    id: "gazebo-domain-randomization",
    repository: "neka-nat/gazebo_domain_randomization",
    description:
      "Published runtime visual updates through Gazebo Transport so ROS cameras observe domain-randomized colors.",
    href: "https://github.com/neka-nat/gazebo_domain_randomization/pull/5",
    linkLabel: "Merged PR #5",
    mergedPrCount: 1,
    tags: ["C++", "Gazebo", "ROS"],
  },
  {
    id: "moveit-serialization",
    repository: "captain-yoshi/moveit_serialization",
    description: "Fixed CMake installation of C++ headers for downstream consumers.",
    href: "https://github.com/captain-yoshi/moveit_serialization/pull/9",
    linkLabel: "Merged PR #9",
    mergedPrCount: 1,
    tags: ["C++", "CMake", "MoveIt"],
  },
  {
    id: "openrave-installation",
    repository: "cielavenir/openrave-installation",
    description:
      "Integrated pybind11 patches that restore OpenRAVE inverse-kinematics generation.",
    href: "https://github.com/cielavenir/openrave-installation/pull/1",
    linkLabel: "Merged PR #1",
    mergedPrCount: 1,
    tags: ["Python", "OpenRAVE", "pybind11"],
  },
] satisfies readonly Contribution[];
