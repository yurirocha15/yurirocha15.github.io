import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { portfolioContent } from "../../src/content";
import {
  ControllerRuntimeVisual,
  GpuPlatformVisual,
  KimsVisual,
  TopicVisual,
} from "../../src/visuals/staticVisuals";

const labels = portfolioContent.visuals;

describe("source-backed static project visuals", () => {
  test("keeps controller software inside its boundary and robot hardware outside", () => {
    const { container } = render(<ControllerRuntimeVisual labels={labels} />);
    const boundary = container.querySelector(".controller-boundary")!;

    expect(boundary.querySelector(".controller-interface-node")).toBeTruthy();
    expect(boundary.querySelector(".controller-task-manager")).toBeTruthy();
    expect(boundary.querySelectorAll(".controller-task-list > span")).toHaveLength(4);
    expect(boundary.querySelector(".robot-hardware-node")).toBeNull();
    expect(container.querySelector(".robot-hardware-node")).toBeTruthy();
    expect(container.querySelectorAll(".controller-arrow")).toHaveLength(3);
    expect(container).toHaveTextContent("agentic workflow");
    expect(container).toHaveTextContent("agent interface");
    expect(container).toHaveTextContent("task manager");
    expect(container).toHaveTextContent("robot hardware");
    expect(container).not.toHaveTextContent("outside controller");
    expect(container).not.toHaveTextContent("selects + dispatches");
    expect(container).not.toHaveTextContent("state feedback");
  });

  test("keeps platform tabs while showing deployment state inside LLM serving", () => {
    const { container } = render(<GpuPlatformVisual labels={labels} />);

    expect(container.querySelectorAll(".platform-tabs > span")).toHaveLength(3);
    expect(container.querySelector(".platform-tabs > .is-active")).toHaveTextContent("LLM serving");
    expect(container).toHaveTextContent("Simulation");
    expect(container).toHaveTextContent("Monitoring");
    expect(container.querySelectorAll(".deployment-row")).toHaveLength(2);
    expect(container).toHaveTextContent("ready replicas");
    expect(container).toHaveTextContent("2 / 2");
    expect(container).toHaveTextContent("deploying");
    expect(container.querySelector(".gpu-row, .scheduler-pulse")).toBeNull();
  });

  test("labels every container metric with a value and measurement source", () => {
    const { container } = render(<TopicVisual labels={labels} />);
    const cpu = container.querySelector(".topic-metric--cpu")!;
    const memory = container.querySelector(".topic-metric--memory")!;
    const gpu = container.querySelector(".topic-metric--gpu")!;

    expect(container.querySelectorAll(".topic-metric")).toHaveLength(3);
    expect(cpu).toHaveTextContent("CPU");
    expect(cpu).toHaveTextContent("1.2 / 2.0 cores");
    expect(cpu).toHaveTextContent("cgroup limit");
    expect(memory).toHaveTextContent("memory");
    expect(memory).toHaveTextContent("640 / 1024 MiB");
    expect(memory).toHaveTextContent("cgroup limit");
    expect(gpu).toHaveTextContent("GPU");
    expect(gpu).toHaveTextContent("42%");
    expect(gpu).toHaveTextContent("NVML");
    expect(container).not.toHaveTextContent("container view");
    expect(container.querySelector(".terminal-bar, .pod-grid")).toBeNull();
  });

  test("shows four vectorized CartPole environments without a training dashboard", () => {
    const { container } = render(<KimsVisual labels={labels} />);

    expect(container.querySelectorAll(".cartpole-grid > .cartpole-env")).toHaveLength(4);
    expect(container).toHaveTextContent("Isaac Sim");
    expect(container).toHaveTextContent("vectorized environments");
    expect(container).not.toHaveTextContent("before training");
    expect(container).not.toHaveTextContent("training iterations");
    expect(container).not.toHaveTextContent("after training");
    expect(container).not.toHaveTextContent("PPO");
    expect(container).not.toHaveTextContent("rollouts");
    expect(container).not.toHaveTextContent("reward");
  });
});
