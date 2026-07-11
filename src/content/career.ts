import type { Experience } from "./types";

export const experience = [
  {
    id: "doosan-robotics",
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
    id: "makinarocks",
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
    id: "skku",
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
    id: "moringa-digital",
    period: "2016 - 2017",
    role: "Software Developer",
    company: "Moringa Digital",
    detail: "ERP integration and web/mobile application development.",
    bullets: ["Built Node.js services that connected application workflows to ERP systems."],
    tags: ["Node.js", "APIs", "Integration"],
  },
] satisfies readonly Experience[];
