import type { Language, TagGroup } from "./types";

export const skills = [
  {
    id: "robotics",
    title: "Robotics",
    items: ["ROS / ROS 2", "MoveIt", "OMPL", "Motion Planning", "Autonomous Navigation"],
  },
  {
    id: "software",
    title: "Software",
    items: ["C++", "Python", "Go", "Linux", "JavaScript", "Node.js", "Software Architecture", "Parallel Algorithms"],
  },
  {
    id: "real-time-systems",
    title: "Real-time Systems",
    items: ["Real-time Linux", "PREEMPT_RT", "Xenomai"],
  },
  {
    id: "machine-learning",
    title: "Machine Learning",
    items: ["PyTorch", "ONNX", "LLMs", "Quantization", "Model Optimization"],
  },
  {
    id: "simulation",
    title: "Robotics Simulation & Learning",
    items: ["Isaac Sim", "MuJoCo", "Unity3D", "Gazebo", "Reinforcement Learning"],
  },
  {
    id: "infrastructure",
    title: "Infrastructure",
    items: ["Kubernetes", "Docker", "GitHub Actions", "CI/CD", "LLMOps"],
  },
] satisfies readonly TagGroup[];

export const languages = [
  { id: "portuguese", name: "Portuguese", flag: "🇧🇷" },
  { id: "english", name: "English", flag: "🇺🇸" },
  { id: "korean", name: "Korean", flag: "🇰🇷" },
  { id: "french", name: "French", flag: "🇫🇷" },
] satisfies readonly Language[];
