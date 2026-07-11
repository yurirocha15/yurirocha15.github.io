import type { Language, TagGroup } from "./types";

export const skills = [
  {
    id: "robotics",
    title: "Robotics",
    items: ["ROS 2", "Motion Planning", "Industrial Robots", "Collaborative Robots", "Autonomous Navigation"],
  },
  {
    id: "systems",
    title: "Systems",
    items: ["C++", "Real-Time", "TCP/UDP", "IPC", "Linux", "Parallel Algorithms", "Performance Profiling"],
  },
  {
    id: "ai",
    title: "AI",
    items: ["Python", "PyTorch", "LLMs", "ONNX", "MoE", "Mamba", "Quantization", "Edge Inference", "NPU Optimization", "Visual Reasoning"],
  },
  {
    id: "infrastructure",
    title: "Infrastructure",
    items: ["Go", "Kubernetes", "Docker", "LLM Serving", "CI/CD", "MLOps", "Ansible", "Release Operations"],
  },
] satisfies readonly TagGroup[];

export const languages = [
  { id: "portuguese", name: "Portuguese", flag: "🇧🇷" },
  { id: "english", name: "English", flag: "🇺🇸" },
  { id: "korean", name: "Korean", flag: "🇰🇷" },
  { id: "french", name: "French", flag: "🇫🇷" },
] satisfies readonly Language[];
