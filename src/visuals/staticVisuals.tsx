export function ControllerRuntimeVisual() {
  return (
    <div className="controller-diagram">
      <div className="cycle-strip">
        <strong>real-time controller</strong>
        <span><i /><i /><i /><i /></span>
      </div>
      <div className="schedule-overview">
        <div>
          <strong>task management</strong>
          <span><i /><i /><i /></span>
        </div>
        <div>
          <strong>data flow</strong>
          <span><i /><i /><i /><i /></span>
        </div>
      </div>
      <div className="task-manager-graph">
        <div className="external-stack"><span>agent</span></div>
        <div className="input-flow"><i><b /></i></div>
        <div className="task-manager-node">
          <strong>agent interface</strong>
          <small>agentic workflows</small>
        </div>
        <div className="task-fanout"><i><b /></i><i><b /></i><i><b /></i><i><b /></i></div>
        <div className="controller-tasks">
          <span>task 01</span><span>task 02</span><span>task 03</span><span>task 04</span>
        </div>
        <div className="hardware-flow"><i><b /></i><i><b /></i></div>
        <div className="hardware-node">real robot</div>
      </div>
    </div>
  );
}

export function GpuPlatformVisual() {
  return (
    <>
      <div className="platform-console">
        <div className="platform-toolbar">
          <span /><span /><span /><strong>deployment platform</strong>
        </div>
        <div className="platform-body">
          <div className="workload-list">
            <div className="workload-row is-active"><strong>LLM environment</strong><span>deploy</span></div>
            <div className="workload-row"><strong>Simulation</strong><span>deploy</span></div>
            <div className="workload-row"><strong>Metrics</strong><span>monitor</span></div>
          </div>
          <div className="gpu-cluster">
            <div className="cluster-title"><strong>Kubernetes cluster</strong><span>healthy</span></div>
            <div className="gpu-row"><span>LLM</span><i><b /></i></div>
            <div className="gpu-row"><span>SIM</span><i><b /></i></div>
            <div className="gpu-row"><span>METRICS</span><i><b /></i></div>
          </div>
        </div>
      </div>
      <div className="scheduler-pulse" />
    </>
  );
}

export function EdgeLlmVisual() {
  return (
    <>
      <div className="llm-phone">
        <div className="phone-speaker" />
        <div className="phone-screen">
          <div className="phone-model-title"><strong>LLM</strong><span>on-device</span></div>
          <div className="model-layers"><span /><span /><span /><span /></div>
          <div className="on-device-chip"><strong>EDGE</strong><small>inference</small></div>
          <div className="token-stream"><span /><span /><span /><span /></div>
        </div>
      </div>
      <div className="phone-signal"><span /><span /><span /></div>
    </>
  );
}

export function McpVisual() {
  return (
    <>
      <div className="native-cpp-panel">
        <div className="visual-panel-title"><strong>C++ application</strong><span>native runtime</span></div>
        <div className="native-api-list"><span>robot API</span><span>planner</span><span>telemetry</span></div>
      </div>
      <div className="mcp-flow mcp-flow-native"><span>typed calls</span><i><b /></i></div>
      <div className="mcp-sdk-bridge">
        <strong>mcp-cpp-sdk</strong>
        <small>C++20 / Boost.Asio</small>
        <div><span>tools</span><span>resources</span><span>JSON-RPC</span></div>
      </div>
      <div className="mcp-flow mcp-flow-agent"><span>MCP</span><i><b /></i></div>
      <div className="agent-panel">
        <div className="agent-panel-title"><span>AI</span><strong>Agent</strong></div>
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

export function LeetcodeVisual() {
  return (
    <>
      <div className="scraper-browser">
        <div className="scraper-browser-bar"><i /><i /><i /><span>leetcode.com</span></div>
        <div className="scraper-page">
          <strong>Problem 0042</strong><span>description</span><span>examples</span>
          <small>Accepted</small><i className="scraper-scan" />
        </div>
      </div>
      <div className="scraper-engine"><strong>leet2git</strong><small>Python scraper</small><i><b /></i></div>
      <div className="generated-repo">
        <strong>Git repository</strong><span>0042.cpp</span><span>test_0042.py</span><span>README.md</span>
      </div>
    </>
  );
}

export function KimsVisual() {
  return (
    <>
      <div className="kims-sim-panel">
        <div className="kims-sim-toolbar"><strong>Isaac Sim</strong><span>vectorized environments</span></div>
        <div className="cartpole-grid">
          {[0, 1, 2, 3].map((index) => (
            <div className="cartpole-env" key={index}><i /><b><span /></b></div>
          ))}
        </div>
      </div>
      <div className="kims-training-panel">
        <div className="kims-policy-node"><strong>PPO</strong><span>policy</span></div>
        <div className="kims-trainers"><span>Stable-Baselines3</span><span>RL-Games</span></div>
        <div className="kims-rollout-flow"><small>rollouts</small><i><b /></i></div>
        <div className="kims-reward-chart">
          <strong>reward</strong><div><i /><i /><i /><i /><i /><i /></div>
        </div>
      </div>
    </>
  );
}

type StaticSceneFallbackProps = {
  variant: "hero" | "palletizer" | "smart-frame";
};

const staticSceneCopy = {
  hero: { eyebrow: "Robot software", title: "Agent-first control", detail: "Real-time core" },
  palletizer: { eyebrow: "Vision + planning", title: "Mixed palletizing", detail: "Explainable" },
  "smart-frame": { eyebrow: "Parallel planning", title: "Robot programming", detail: "Welding line" },
} as const;

export function StaticSceneFallback({ variant }: StaticSceneFallbackProps) {
  const copy = staticSceneCopy[variant];

  return (
    <div
      className={"static-scene-fallback static-scene-fallback--" + variant}
      data-scene-fallback={variant}
    >
      <div className="fallback-scene-header">
        <span>{copy.eyebrow}</span>
        <strong>{copy.title}</strong>
        <small>{copy.detail}</small>
      </div>
      <div className="fallback-cell">
        <i className="fallback-motion-arc" />
        <i className="fallback-robot-base" />
        <i className="fallback-robot-arm fallback-robot-arm--lower" />
        <i className="fallback-robot-joint fallback-robot-joint--base" />
        <i className="fallback-robot-arm fallback-robot-arm--upper" />
        <i className="fallback-robot-joint fallback-robot-joint--elbow" />
        <i className="fallback-robot-tool" />
        {variant === "hero" ? <div className="fallback-agent-terminal"><i /><i /><i /></div> : null}
        {variant === "palletizer" ? <div className="fallback-box-stack"><i /><i /><i /></div> : null}
        {variant === "smart-frame" ? <div className="fallback-welding-frame"><i /><i /><i /></div> : null}
      </div>
      <div className="fallback-scene-status"><i /> Static mode</div>
    </div>
  );
}
