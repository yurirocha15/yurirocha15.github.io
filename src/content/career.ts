import type { Experience } from "./types";

export const experience = [
  {
    id: "doosan-robotics",
    period: "Aug. 2025 - now",
    role: "Senior Software Engineer, AI & Software",
    company: "Doosan Robotics",
    detail:
      "Real-time robot-controller architecture, agentic integration, Kubernetes LLMOps, and official developer APIs.",
    bullets: [
      "Architecting and developing core real-time software for high-performance robotic controllers, including task-management and data-flow design.",
      "Developing software interfaces and harnesses that enable agentic workflows to interact with and operate real robots.",
      "Managing the internal Kubernetes cluster and maintaining CI/CD and LLMOps pipelines for continuous development and deployment.",
      "Designed and developed a web platform that lets developers deploy LLMs and simulation environments on Kubernetes and monitor their metrics.",
      "Spearheading development, release cycles, and ongoing maintenance for official open-source C++ APIs and ROS packages.",
    ],
    tags: ["C++", "Python", "Real-time Linux", "Software Architecture", "Agentic Workflows", "ROS 2", "Kubernetes", "CI/CD", "LLMOps"],
  },
  {
    id: "makinarocks",
    period: "Sep. 2020 - Aug. 2025",
    role: "Robotics and Machine Learning Research Engineer",
    company: "MakinaRocks",
    detail:
      "Automated robot programming for large spot-welding lines, parallel C++ planning, scalable deployment, and model-level LLM optimization.",
    bullets: [
      "Led the software architecture of an automated robot-programming system for spot-welding assembly lines containing hundreds of robots, reducing the workflow from approximately six weeks to three days.",
      "Developed highly parallelized C++ planning algorithms using ROS, MoveIt, OMPL, and MongoDB for work-point validation, trajectory generation and evaluation, task distribution, and collision-aware coordination.",
      "Built and operated Kubernetes and Docker infrastructure for compute-intensive planning workloads, with Linux and GitHub Actions CI/CD for build, test, packaging, and delivery.",
      "Conducted imitation- and reinforcement-learning experiments and simulation development using PyTorch and Unity3D.",
      "During a one-year ML assignment, built PyTorch/ONNX workflows for model and graph optimization, quantization, and repeatable evaluation targeting mobile edge devices.",
    ],
    tags: ["C++", "Python", "ROS", "MoveIt", "OMPL", "MongoDB", "Kubernetes", "Docker", "PyTorch", "ONNX"],
  },
  {
    id: "moringa-digital",
    period: "Aug. 2016 - Jul. 2017",
    role: "Software Developer",
    company: "Moringa Digital",
    detail: "ERP integration and web back-end development.",
    bullets: [
      "Developed a Node.js service that automated integration between a public-procurement platform and customer ERP systems.",
      "Worked directly with customer technology teams.",
    ],
    tags: ["Node.js", "JavaScript", "MongoDB", "Integration"],
  },
] satisfies readonly Experience[];
