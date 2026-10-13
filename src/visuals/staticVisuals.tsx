import { useEffect, useRef, useState, type RefObject } from "react";
import type { PortfolioContent } from "../content";

type VisualLabels = PortfolioContent["visuals"];

type VisualProps = {
  labels: VisualLabels;
};

const LLM_DEPLOYMENTS = [
  { id: "llm-serving-01", readyReplicas: 2, status: "ready" },
  { id: "llm-serving-02", readyReplicas: 1, status: "deploying" },
] as const;

const DEPLOYMENT_REPLICA_INDEXES = [0, 1] as const;
const CARTPOLE_ENVIRONMENT_INDEXES = [0, 1, 2, 3] as const;

const TOPIC_CPU_LIMIT_CORES = 2;
const TOPIC_MEMORY_LIMIT_MIB = 1024;
const TOPIC_SAMPLE_INTERVAL_MS = 1400;
const TOPIC_SAMPLES = [
  { cpuCores: 1.2, memoryMib: 640, gpuPercent: 42 },
  { cpuCores: 1.5, memoryMib: 668, gpuPercent: 57 },
  { cpuCores: 0.9, memoryMib: 652, gpuPercent: 35 },
  { cpuCores: 1.7, memoryMib: 704, gpuPercent: 64 },
] as const;

function useTopicSample(rootRef: RefObject<HTMLElement | null>) {
  const [sampleIndex, setSampleIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      const isActive = rootRef.current?.closest(".project-visual")?.classList.contains("is-active");
      if (isActive) setSampleIndex((current) => (current + 1) % TOPIC_SAMPLES.length);
    }, TOPIC_SAMPLE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [rootRef]);

  return TOPIC_SAMPLES[sampleIndex];
}

export function ControllerRuntimeVisual({ labels }: VisualProps) {
  const copy = labels.controllerRuntime;
  return (
    <div className="controller-architecture">
      <div className="controller-agent-node">
        <strong>{copy.agenticWorkflow}</strong>
      </div>
      <div className="controller-arrow"><i><b /></i></div>
      <div className="controller-boundary">
        <div className="controller-boundary__header">
          <strong>{copy.realTimeController}</strong>
        </div>
        <div className="controller-boundary__body">
          <div className="controller-interface-node">
            <strong>{copy.agentInterface}</strong>
          </div>
          <div className="controller-arrow"><i><b /></i></div>
          <div className="controller-task-manager">
            <div className="controller-task-manager__header">
              <strong>{copy.taskManager}</strong>
            </div>
            <div className="controller-task-list">
              {copy.tasks.map((task) => <span key={task}>{task}</span>)}
            </div>
          </div>
        </div>
      </div>
      <div className="controller-arrow"><i><b /></i></div>
      <div className="robot-hardware-node">
        <strong>{copy.robotHardware}</strong>
      </div>
    </div>
  );
}

export function GpuPlatformVisual({ labels }: VisualProps) {
  const copy = labels.gpuPlatform;

  return (
    <div className="platform-console">
      <div className="platform-toolbar">
        <strong>{copy.deploymentPlatform}</strong>
        <span>{copy.kubernetesCluster}</span>
      </div>
      <div className="platform-tabs">
        <span className="is-active">{copy.llmServing}</span>
        <span>{copy.simulation}</span>
        <span>{copy.monitoring}</span>
      </div>
      <div className="deployment-panel">
        <div className="deployment-heading">
          <strong>{copy.deploymentStatus}</strong>
          <span><i />{copy.clusterHealthy}</span>
        </div>
        <div className="deployment-table">
          <div className="deployment-table__header">
            <span>{copy.deployment}</span>
            <span>{copy.replicas}</span>
            <span>{copy.status}</span>
          </div>
          {LLM_DEPLOYMENTS.map((deployment) => {
            const isReady = deployment.status === "ready";
            return (
              <div className={`deployment-row is-${deployment.status}`} key={deployment.id}>
                <strong>{deployment.id}</strong>
                <div className="deployment-replicas">
                  <span>
                    {DEPLOYMENT_REPLICA_INDEXES.map((replica) => (
                      <i
                        className={replica < deployment.readyReplicas ? "is-ready" : "is-starting"}
                        key={replica}
                      />
                    ))}
                  </span>
                  <strong>{deployment.readyReplicas} / 2</strong>
                </div>
                <span className={`deployment-state is-${deployment.status}`}>
                  <i />
                  {isReady ? copy.ready : copy.deploying}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function EdgeLlmVisual({ labels }: VisualProps) {
  const copy = labels.edgeLlm;
  return (
    <>
      <div className="llm-phone">
        <div className="phone-speaker" />
        <div className="phone-screen">
          <div className="phone-model-title"><strong>LLM</strong><span>{copy.onDevice}</span></div>
          <div className="model-layers"><span /><span /><span /><span /></div>
          <div className="on-device-chip"><strong>{copy.edge}</strong><small>{copy.inference}</small></div>
          <div className="token-stream"><span /><span /><span /><span /></div>
        </div>
      </div>
      <div className="phone-signal"><span /><span /><span /></div>
    </>
  );
}

export function McpVisual({ labels }: VisualProps) {
  const copy = labels.mcp;
  return (
    <>
      <div className="native-cpp-panel">
        <div className="visual-panel-title"><strong>{copy.cppApplication}</strong><span>{copy.nativeRuntime}</span></div>
        <div className="native-api-list"><span>{copy.robotApi}</span><span>{copy.planner}</span><span>{copy.telemetry}</span></div>
      </div>
      <div className="mcp-flow mcp-flow-native"><span>{copy.typedCalls}</span><i><b /></i></div>
      <div className="mcp-sdk-bridge">
        <strong>mcp-cpp-sdk</strong>
        <small>C++20 / Boost.Asio</small>
        <div><span>{copy.tools}</span><span>{copy.resources}</span><span>JSON-RPC</span></div>
      </div>
      <div className="mcp-flow mcp-flow-agent"><span>MCP</span><i><b /></i></div>
      <div className="agent-panel">
        <div className="agent-panel-title"><span>AI</span><strong>{copy.agent}</strong></div>
        <code>call_tool()</code>
        <code>{"{ result }"}</code>
      </div>
    </>
  );
}

export function TopicVisual({ labels }: VisualProps) {
  const copy = labels.topic;
  const terminalRef = useRef<HTMLDivElement>(null);
  const sample = useTopicSample(terminalRef);
  const metrics = [
    {
      className: "cpu",
      label: copy.cpu,
      value: `${sample.cpuCores.toFixed(1)} / ${TOPIC_CPU_LIMIT_CORES.toFixed(1)} cores`,
      usagePercent: (sample.cpuCores / TOPIC_CPU_LIMIT_CORES) * 100,
      source: copy.cgroupLimit,
    },
    {
      className: "memory",
      label: copy.memory,
      value: `${sample.memoryMib} / ${TOPIC_MEMORY_LIMIT_MIB} MiB`,
      usagePercent: (sample.memoryMib / TOPIC_MEMORY_LIMIT_MIB) * 100,
      source: copy.cgroupLimit,
    },
    {
      className: "gpu",
      label: copy.gpu,
      value: `${sample.gpuPercent}%`,
      usagePercent: sample.gpuPercent,
      source: "NVML",
    },
  ];

  return (
    <div className="topic-terminal" ref={terminalRef}>
      <div className="topic-terminal__header">
        <strong>topic</strong>
      </div>
      <div className="topic-scope">
        <strong>{copy.containerResources}</strong>
        <span>{copy.relativeToLimits}</span>
      </div>
      <div className="topic-metrics">
        {metrics.map((metric) => (
          <div className={`topic-metric topic-metric--${metric.className}`} key={metric.label}>
            <div><strong>{metric.label}</strong><span>{metric.value}</span></div>
            <i><b style={{ width: `${metric.usagePercent}%` }} /></i>
            <small>{metric.source}</small>
          </div>
        ))}
      </div>
      <div className="topic-sources">
        <span>Docker</span><span>Kubernetes</span><span>cgroups</span><span>NVML</span>
      </div>
    </div>
  );
}

export function LeetcodeVisual({ labels }: VisualProps) {
  const copy = labels.leetcode;
  return (
    <>
      <div className="scraper-browser">
        <div className="scraper-browser-bar"><i /><i /><i /><span>leetcode.com</span></div>
        <div className="scraper-page">
          <strong>{copy.problem} 0042</strong><span>{copy.description}</span><span>{copy.examples}</span>
          <small>{copy.accepted}</small><i className="scraper-scan" />
        </div>
      </div>
      <div className="scraper-engine"><strong>leet2git</strong><small>{copy.pythonScraper}</small><i><b /></i></div>
      <div className="generated-repo">
        <strong>{copy.gitRepository}</strong><span>0042.py</span><span>test_0042.py</span><span>README.md</span>
      </div>
    </>
  );
}

export function KimsVisual({ labels }: VisualProps) {
  const copy = labels.kims;

  return (
    <div className="kims-sim-panel">
      <div className="kims-sim-toolbar">
        <strong>Isaac Sim</strong>
        <span>{copy.vectorizedEnvironments}</span>
      </div>
      <div className="cartpole-grid">
        {CARTPOLE_ENVIRONMENT_INDEXES.map((environment) => (
          <div className="cartpole-env" key={environment}>
            <i />
            <b><span /></b>
          </div>
        ))}
      </div>
    </div>
  );
}

type StaticSceneFallbackProps = {
  variant: "hero" | "palletizer" | "smart-frame";
  labels: VisualLabels["sceneFallback"];
};

export function StaticSceneFallback({ labels, variant }: StaticSceneFallbackProps) {
  return (
    <div className="static-scene-fallback" data-scene-fallback={variant}>
      <div className="static-scene-fallback__message">
        <strong>{labels.title}</strong>
        <span>{labels.description}</span>
      </div>
    </div>
  );
}
