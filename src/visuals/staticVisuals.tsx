import type { PortfolioContent } from "../content";

type VisualLabels = PortfolioContent["visuals"];

type VisualProps = {
  labels: VisualLabels;
};

export function ControllerRuntimeVisual({ labels }: VisualProps) {
  const copy = labels.controllerRuntime;
  return (
    <div className="controller-diagram">
      <div className="cycle-strip">
        <strong>{copy.realTimeController}</strong>
        <span><i /><i /><i /><i /></span>
      </div>
      <div className="schedule-overview">
        <div>
          <strong>{copy.taskManagement}</strong>
          <span><i /><i /><i /></span>
        </div>
        <div>
          <strong>{copy.dataFlow}</strong>
          <span><i /><i /><i /><i /></span>
        </div>
      </div>
      <div className="task-manager-graph">
        <div className="external-stack"><span>{copy.agent}</span></div>
        <div className="input-flow"><i><b /></i></div>
        <div className="task-manager-node">
          <strong className="task-manager-node__title">{copy.agentInterface}</strong>
          <span className="task-manager-node__subtitle">{copy.agenticWorkflows}</span>
        </div>
        <div className="task-fanout"><i><b /></i><i><b /></i><i><b /></i><i><b /></i></div>
        <div className="controller-tasks">
          {copy.tasks.map((task) => <span key={task}>{task}</span>)}
        </div>
        <div className="hardware-flow"><i><b /></i><i><b /></i></div>
        <div className="hardware-node">{copy.realRobot}</div>
      </div>
    </div>
  );
}

export function GpuPlatformVisual({ labels }: VisualProps) {
  const copy = labels.gpuPlatform;
  return (
    <>
      <div className="platform-console">
        <div className="platform-toolbar">
          <span /><span /><span /><strong>{copy.deploymentPlatform}</strong>
        </div>
        <div className="platform-body">
          <div className="workload-list">
            <div className="workload-row is-active"><strong>{copy.llmEnvironment}</strong><span>{copy.deploy}</span></div>
            <div className="workload-row"><strong>{copy.simulation}</strong><span>{copy.deploy}</span></div>
            <div className="workload-row"><strong>{copy.metrics}</strong><span>{copy.monitor}</span></div>
          </div>
          <div className="gpu-cluster">
            <div className="cluster-title"><strong>{copy.kubernetesCluster}</strong><span>{copy.healthy}</span></div>
            <div className="gpu-row"><span>{copy.llmAbbreviation}</span><i><b /></i></div>
            <div className="gpu-row"><span>{copy.simulationAbbreviation}</span><i><b /></i></div>
            <div className="gpu-row"><span>{copy.metricsAbbreviation}</span><i><b /></i></div>
          </div>
        </div>
      </div>
      <div className="scheduler-pulse" />
    </>
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

export function TopicVisual() {
  return (
    <>
      <div className="terminal-bar" />
      <div className="metric-line cpu" />
      <div className="metric-line memory" />
      <div className="metric-line gpu" />
      <div className="pod-grid"><span /><span /><span /><span /></div>
    </>
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
        <strong>{copy.gitRepository}</strong><span>0042.cpp</span><span>test_0042.py</span><span>README.md</span>
      </div>
    </>
  );
}

export function KimsVisual({ labels }: VisualProps) {
  const copy = labels.kims;
  return (
    <>
      <div className="kims-sim-panel">
        <div className="kims-sim-toolbar"><strong>Isaac Sim</strong><span>{copy.vectorizedEnvironments}</span></div>
        <div className="cartpole-grid">
          {[0, 1, 2, 3].map((index) => (
            <div className="cartpole-env" key={index}><i /><b><span /></b></div>
          ))}
        </div>
      </div>
      <div className="kims-training-panel">
        <div className="kims-policy-node"><strong>PPO</strong><span>{copy.policy}</span></div>
        <div className="kims-trainers"><span>Stable-Baselines3</span><span>RL-Games</span></div>
        <div className="kims-rollout-flow"><small>{copy.rollouts}</small><i><b /></i></div>
        <div className="kims-reward-chart">
          <strong>{copy.reward}</strong><div><i /><i /><i /><i /><i /><i /></div>
        </div>
      </div>
    </>
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
