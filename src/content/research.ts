import type { Award, Publication } from "./types";

export const publications = [
  {
    id: "semantic-environment-modeling",
    year: "2020",
    title:
      "Autonomous Navigation Framework for Intelligent Robots Based on a Semantic Environment Modeling",
    venue: "Applied Sciences",
    href: "https://www.mdpi.com/2076-3417/10/9/3219/pdf",
  },
  {
    id: "msc-thesis",
    year: "2020",
    title:
      "Mental Simulation for Autonomous Learning and Planning Using an Ontology-Based Modeling Framework",
    venue: "M.Sc. thesis, Sungkyunkwan University",
    href: "./assets/Yuri_Master_Thesis.pdf",
  },
  {
    id: "mental-simulation-iros",
    year: "2019",
    title:
      "Mental Simulation for Autonomous Learning and Planning Based on Triplet Ontological Semantic Model",
    venue: "CEUR Workshop Proceedings",
    href: "./assets/Mental_Simulation_IROS_2019.pdf",
  },
  {
    id: "automatic-generation-iccas",
    year: "2019",
    title:
      "Automatic Generation of a Simulated Robot from an Ontology-Based Semantic Description",
    venue: "ICCAS",
    href: "./assets/Automatic_Generation_ICCAS2019.pdf",
  },
  {
    id: "cooperative-manipulation-ccta",
    year: "2017",
    title:
      "Design of Singularity-Robust and Task-Priority Primitive Controllers for Cooperative Manipulation",
    venue: "IEEE CCTA",
    href: "./assets/Design-of-singularity-robust-and-task-priority-primitive-controllers_CCTA_2017.pdf",
  },
] satisfies readonly Publication[];

export const awards = [
  {
    id: "nvidia-cosmos-cookoff",
    year: "2026",
    title: "NVIDIA Cosmos Cookoff",
    detail: "First place with Team Zenith among more than 1,600 hackathon participants worldwide",
  },
  {
    id: "academic-achievement",
    year: "2019",
    title: "Academic Achievement Award",
    detail: "Korean Government Scholarship Program",
  },
  {
    id: "kgsp",
    year: "2017",
    title: "Korean Government Scholarship Program",
    detail: "Graduate scholarship recipient",
  },
  {
    id: "larc",
    year: "2016",
    title: "Latin American Robotics Competition",
    detail:
      "Won first place in the Standard Platform League with UnBeatables at Latin America’s humanoid robot football competition",
  },
  {
    id: "robocup",
    year: "2016",
    title: "RoboCup Standard Platform League",
    detail: "Won the Best Drop-in Only Team award with UnBeatables at RoboCup",
  },
] satisfies readonly Award[];
