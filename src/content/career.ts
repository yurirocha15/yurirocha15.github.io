import type { Experience } from "./types";

export const experience = [
  {
    id: "doosan-robotics",
    period: "Aug. 2025 - now",
    role: "Senior Software Engineer, AI & Software",
    company: "Doosan Robotics",
    detail:
      "Core robot-controller software, Kubernetes infrastructure, and official open-source C++ APIs and ROS packages.",
    bullets: [
      "Architecting and developing the core C++ software for high-performance robot controllers.",
      "Operating the internal Kubernetes cluster and maintaining CI/CD and LLMOps pipelines for continuous development and deployment.",
      "Owning the development, release cycle, and maintenance of official C++ APIs and ROS packages used by robot application developers.",
    ],
    tags: ["C++", "Linux", "ROS 2", "Kubernetes", "CI/CD", "LLMOps"],
  },
  {
    id: "makinarocks",
    period: "Sep. 2020 - Aug. 2025",
    role: "Robotics and Machine Learning Research Engineer",
    company: "MakinaRocks",
    detail:
      "Automated industrial robot programming, parallel C++ planning, scalable deployment, and model-level LLM optimization.",
    bullets: [
      "Led the architecture of an automated robot-programming system that reduced industrial automation work from six weeks to three days.",
      "Developed highly parallelized C++ algorithms using ROS, MoveIt, and OMPL.",
      "Managed Kubernetes infrastructure for scalable deployment and operation.",
      "During a one-year ML assignment, optimized LLM architectures and ONNX graphs at the model level for edge-NPU deployment and evaluation.",
    ],
    tags: ["C++", "ROS", "MoveIt", "OMPL", "Kubernetes", "PyTorch", "ONNX"],
  },
  {
    id: "moringa-digital",
    period: "Aug. 2016 - Jul. 2017",
    role: "Software Developer",
    company: "Moringa Digital",
    detail: "ERP integration and web/mobile application development.",
    bullets: [
      "Developed a Node.js service that automated integration between a public-procurement platform and customer ERP systems.",
      "Worked directly with customer technology teams.",
    ],
    tags: ["Node.js", "JavaScript", "MongoDB", "Integration"],
  },
] satisfies readonly Experience[];
