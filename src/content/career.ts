import type { Experience } from "./types";

export const experience = [
  {
    id: "doosan-robotics",
    period: "Aug.\u00a02025–Present",
    role: "Senior Software Engineer, AI & Software",
    company: "Doosan Robotics",
    detail:
      "Real-time robot controller architecture, agent interfaces for physical robots, Kubernetes-based LLMOps infrastructure, and official C++ APIs and ROS packages.",
    bullets: [
      "Architecting and developing core real-time software for high-performance robot controllers, including task-management and data-flow design.",
      "Developing software interfaces and harnesses that enable agentic workflows to interact with and operate real robots.",
      "Managing the internal Kubernetes cluster and maintaining CI/CD and LLMOps pipelines for continuous development and deployment.",
      "Designed and developed a web platform that lets developers deploy LLM-serving and robotics-simulation workloads to Kubernetes and monitor workload metrics.",
      "Leading the development, release, and ongoing maintenance of official open-source C++ APIs and ROS packages.",
    ],
    tags: ["C++", "Python", "Real-time Linux", "Software Architecture", "Agentic Workflows", "ROS 2", "Kubernetes", "CI/CD", "LLMOps"],
  },
  {
    id: "makinarocks",
    period: "Sep.\u00a02020–Aug.\u00a02025",
    role: "Robotics and Machine Learning Research Engineer",
    company: "MakinaRocks",
    detail:
      "Automated robot programming for large spot-welding lines, parallel C++ planning, scalable deployment, and model- and graph-level LLM optimization.",
    bullets: [
      "Led the software architecture of an automated robot-programming system for spot-welding assembly lines containing hundreds of robots, cutting robot-programming time from approximately six weeks to three days.",
      "Developed a highly parallelized C++ motion-planning system with ROS, MoveIt, and OMPL for work-point validation, trajectory generation and evaluation, task distribution, and collision-aware coordination; used MongoDB for planning data.",
      "Built and operated Kubernetes and Docker infrastructure for compute-intensive planning workloads, plus Linux-based CI/CD pipelines in GitHub Actions for builds, tests, packaging, and delivery.",
      "Conducted imitation learning and reinforcement learning experiments with PyTorch and developed simulation environments in Unity.",
      "Built PyTorch/ONNX workflows for model- and graph-level optimization, quantization, and repeatable evaluation targeting on-device inference on mobile hardware.",
    ],
    tags: ["C++", "Python", "ROS", "MoveIt", "OMPL", "MongoDB", "Kubernetes", "Docker", "PyTorch", "ONNX"],
  },
  {
    id: "moringa-digital",
    period: "Aug.\u00a02016–Jul.\u00a02017",
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
