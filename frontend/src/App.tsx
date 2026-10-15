import { useState, useEffect } from 'react';
import {
  Terminal,
  Activity,
  Clock,
  Zap,
  Layers,
  GitBranch,
  Server
} from 'lucide-react';

interface FeatureMetric {
  ks_statistic: number;
  p_value: number;
  psi_score: number;
  wasserstein_distance: number;
  drift_detected: boolean;
}

interface DriftReport {
  is_dataset_drifted: boolean;
  drift_share: number;
  threshold: number;
  drifted_features_count: number;
  features_evaluated: number;
  metrics_per_feature: Record<string, FeatureMetric>;
  recommended_action: string;
}

interface PipelineStage {
  stage: string;
  status: string;
}

interface HealingWorkflow {
  workflow_id: string;
  status: string;
  pipeline_stages: PipelineStage[];
  estimated_duration_sec: number;
}

export default function App() {
  const [driftLevel, setDriftLevel] = useState<'none' | 'mild' | 'severe'>('severe');
  const [report, setReport] = useState<DriftReport | null>(null);
  const [workflow, setWorkflow] = useState<HealingWorkflow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'drift' | 'canary' | 'registry' | 'logs'>('drift');
  const [logs, setLogs] = useState<string[]>([
    "[KSERVE_MESH] 4 Inferenceservices running on Kubernetes cluster.",
    "[EVIDENTLY_AI] Baseline reference distribution loaded (1,000 samples).",
    "[ARGO_DAG] Argo Workflows controller ready for automated self-healing triggers.",
    "[CANARY] 90/10 traffic split configured via Istio VirtualService."
  ]);
  const [uptimeSeconds, setUptimeSeconds] = useState(5120);
  const [cliCopied, setCliCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setUptimeSeconds(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleEvaluateDrift = async (level = driftLevel) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/drift/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drift_level: level })
      });

      if (res.ok) {
        const data = await res.json();
        setReport(data);
        setLogs(prev => [
          `[DRIFT_EVAL] Level: ${level.toUpperCase()} | Drift Share: ${(data.drift_share * 100).toFixed(1)}% | Drifted: ${data.is_dataset_drifted ? 'YES' : 'NO'}`,
          ...prev.slice(0, 15)
        ]);
      } else {
        throw new Error("API call failed");
      }
    } catch {
      // Fallback simulation
      const isSevere = level === 'severe';
      const isMild = level === 'mild';
      setReport({
        is_dataset_drifted: isSevere,
        drift_share: isSevere ? 0.50 : (isMild ? 0.25 : 0.00),
        threshold: 0.30,
        drifted_features_count: isSevere ? 2 : 0,
        features_evaluated: 4,
        recommended_action: isSevere ? "TRIGGER_SELF_HEALING" : "NO_ACTION_REQUIRED",
        metrics_per_feature: {
          latency: { ks_statistic: isSevere ? 0.842 : 0.082, p_value: isSevere ? 1.4e-28 : 0.42, psi_score: isSevere ? 1.24 : 0.04, wasserstein_distance: isSevere ? 1.78 : 0.05, drift_detected: isSevere },
          feature_a: { ks_statistic: isSevere ? 0.791 : 0.071, p_value: isSevere ? 2.1e-24 : 0.51, psi_score: isSevere ? 0.98 : 0.03, wasserstein_distance: isSevere ? 1.65 : 0.04, drift_detected: isSevere },
          feature_b: { ks_statistic: 0.062, p_value: 0.64, psi_score: 0.02, wasserstein_distance: 0.03, drift_detected: false },
          feature_c: { ks_statistic: 0.054, p_value: 0.72, psi_score: 0.01, wasserstein_distance: 0.02, drift_detected: false },
        }
      });
      setLogs(prev => [
        `[DRIFT_EVAL] Level: ${level.toUpperCase()} | Drift Share: ${isSevere ? '50.0%' : '0.0%'} | Status: Evaluated`,
        ...prev.slice(0, 15)
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleEvaluateDrift('severe');
  }, []);

  const handleTriggerSelfHealing = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/healing/trigger', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setWorkflow(data);
        setLogs(prev => [
          `[SELF_HEALING] Triggered Argo Workflow: ${data.workflow_id} | Stage: Active Learning Sampling`,
          ...prev.slice(0, 15)
        ]);
      }
    } catch {
      setWorkflow({
        workflow_id: `argo-retrain-9284`,
        status: "RUNNING",
        estimated_duration_sec: 180,
        pipeline_stages: [
          { stage: "Data Validation (Great Expectations)", status: "COMPLETED" },
          { stage: "Active Learning Sampling (Evidently)", status: "RUNNING" },
          { stage: "Distributed Retraining (Ray + PyTorch)", status: "PENDING" },
          { stage: "Canary Rollout 10% (KServe)", status: "PENDING" },
        ]
      });
      setLogs(prev => [
        `[SELF_HEALING] Triggered Argo Workflow: argo-retrain-9284 (Simulated)`,
        ...prev.slice(0, 15)
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyCli = () => {
    navigator.clipboard.writeText("just monitor drift=severe");
    setCliCopied(true);
    setTimeout(() => setCliCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top HUD */}
      <header style={{
        height: '36px',
        borderBottom: '1px solid var(--hairline)',
        background: 'rgba(7, 9, 10, 0.95)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pulse-dot"></span>
            <span style={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              bernardbdas<span style={{ color: 'var(--accent)' }}>.github.io</span>
            </span>
          </div>
          <span style={{ color: 'var(--ink-faint)' }}>//</span>
          <span className="brutalist-badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            SYS_04 // ENTERPRISE MLOPS
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '11px', color: 'var(--ink-dim)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={12} color="var(--phosphor)" />
            <span>UPTIME: {Math.floor(uptimeSeconds / 60)}M {uptimeSeconds % 60}S</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={12} color="var(--accent)" />
            <span>SLA: 99.99%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Server size={12} color="var(--cyan)" />
            <span>KEDA HPA: 8 PODS</span>
          </div>
          <span className="brutalist-badge" style={{ background: 'rgba(184, 200, 96, 0.1)', color: 'var(--phosphor)' }}>
            SELF-HEALING ACTIVE
          </span>
        </div>
      </header>

      {/* Main Workspace */}
      <main style={{ flex: 1, padding: '24px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        {/* Hero Section */}
        <section style={{ marginBottom: '28px', borderBottom: '1px solid var(--hairline)', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <span className="brutalist-badge" style={{ color: 'var(--cyan)' }}>EVIDENTLY AI DRIFT DETECTOR</span>
                <span className="brutalist-badge" style={{ color: 'var(--phosphor)' }}>ARGO WORKFLOWS SELF-HEALING</span>
                <span className="brutalist-badge" style={{ color: 'var(--accent)' }}>KSERVE ZERO-DOWNTIME CANARY</span>
              </div>
              <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', textTransform: 'uppercase', marginBottom: '6px' }}>
                Self-Healing Enterprise MLOps Platform & Evaluation Mesh
              </h1>
              <p style={{ color: 'var(--ink-dim)', maxWidth: '850px', fontSize: '13px' }}>
                Cloud-native automated MLOps harness managing the entire model lifecycle. Continuously monitors feature and concept drift, automatically triggers active learning retraining DAGs in Argo Workflows, and executes zero-downtime canary deployments on Kubernetes.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <button
                onClick={copyCli}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 14px',
                  background: 'var(--surface-raised)',
                  fontSize: '11px'
                }}
              >
                <Terminal size={13} color="var(--accent)" />
                <span>{cliCopied ? 'COMMAND COPIED!' : 'COPY CLI MONITOR'}</span>
              </button>
              <span style={{ fontSize: '10px', color: 'var(--ink-faint)' }}>PORT: 8004 // FASTAPI SERVING</span>
            </div>
          </div>
        </section>

        {/* Telemetry Ribbons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="brutalist-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '10px', color: 'var(--ink-dim)', marginBottom: '4px' }}>UPTIME SLA</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--phosphor)' }}>99.99%</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>Zero-downtime canary rollouts</div>
          </div>
          <div className="brutalist-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '10px', color: 'var(--ink-dim)', marginBottom: '4px' }}>SUB-SECOND GPU HPA</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cyan)' }}>&lt;850MS SCALE</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>Custom Prometheus KEDA metrics</div>
          </div>
          <div className="brutalist-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '10px', color: 'var(--ink-dim)', marginBottom: '4px' }}>CANARY TRAFFIC SPLIT</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>90% / 10%</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>Automated rollback on error surge</div>
          </div>
          <div className="brutalist-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '10px', color: 'var(--ink-dim)', marginBottom: '4px' }}>P99 SERVING LATENCY</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>14.2MS</div>
            <div style={{ fontSize: '11px', color: 'var(--phosphor)' }}>KServe v2 data plane</div>
          </div>
        </div>

        {/* Workspace Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Controls Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="brutalist-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Activity size={14} color="var(--accent)" />
                <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                  Drift Simulation Stream
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {[
                  { id: 'severe', title: 'Severe Drift (Shift: +1.8 SD)', desc: 'Violates PSI > 0.25 threshold, triggers automated DAG' },
                  { id: 'mild', title: 'Mild Drift (Shift: +0.25 SD)', desc: 'Monitored within alert zone, below threshold' },
                  { id: 'none', title: 'Stable Baseline (Shift: 0.0 SD)', desc: 'Clean in-distribution production traffic' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setDriftLevel(item.id as any);
                      handleEvaluateDrift(item.id as any);
                    }}
                    style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      background: driftLevel === item.id ? 'var(--surface-highlight)' : 'var(--surface)',
                      borderColor: driftLevel === item.id ? 'var(--accent)' : 'var(--hairline)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '12px', color: driftLevel === item.id ? 'var(--accent)' : 'var(--ink)' }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--ink-dim)' }}>{item.desc}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleTriggerSelfHealing}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--danger)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderColor: 'var(--danger)'
                }}
              >
                <Zap size={14} fill="#ffffff" />
                <span>FORCE TRIGGER ARGO SELF-HEALING</span>
              </button>
            </div>

            <div className="brutalist-card" style={{ padding: '14px', background: 'var(--bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '10px', color: 'var(--ink-faint)' }}>
                <Terminal size={11} />
                <span>JUST RECIPE SHORTCUT:</span>
              </div>
              <code style={{ fontSize: '11px', color: 'var(--phosphor)' }}>
                just monitor drift=severe
              </code>
            </div>
          </div>

          {/* Results Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--hairline)', gap: '4px' }}>
              {[
                { id: 'drift', label: 'DRIFT EVALUATION MATRIX', icon: Activity },
                { id: 'canary', label: 'CANARY & KEDA HPA', icon: GitBranch },
                { id: 'registry', label: 'MLFLOW MODEL REGISTRY', icon: Layers },
                { id: 'logs', label: 'AUTOMATION EVENT LOGS', icon: Terminal },
              ].map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      padding: '8px 16px',
                      borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                      background: active ? 'var(--surface-raised)' : 'transparent',
                      color: active ? 'var(--accent)' : 'var(--ink-dim)',
                      borderRadius: 0,
                      borderTop: 'none',
                      borderLeft: 'none',
                      borderRight: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '11px',
                      fontWeight: 600
                    }}
                  >
                    <Icon size={13} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab: Drift Matrix */}
            {activeTab === 'drift' && (
              <div className="brutalist-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="brutalist-badge" style={{
                      color: report?.is_dataset_drifted ? 'var(--danger)' : 'var(--phosphor)',
                      borderColor: report?.is_dataset_drifted ? 'var(--danger)' : 'var(--phosphor)'
                    }}>
                      {report?.is_dataset_drifted ? 'DATASET DRIFT DETECTED' : 'DATASET STABLE'}
                    </span>
                    <span className="brutalist-badge" style={{ color: 'var(--cyan)' }}>
                      DRIFT SHARE: {((report?.drift_share || 0) * 100).toFixed(1)}% (THRESHOLD: 30%)
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>
                    ACTION: {report?.recommended_action || "MONITORING"}
                  </span>
                </div>

                {/* Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--hairline)', color: 'var(--ink-dim)', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>FEATURE</th>
                      <th style={{ padding: '8px' }}>KS STAT</th>
                      <th style={{ padding: '8px' }}>P-VALUE</th>
                      <th style={{ padding: '8px' }}>PSI SCORE</th>
                      <th style={{ padding: '8px' }}>WASSERSTEIN</th>
                      <th style={{ padding: '8px' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(report?.metrics_per_feature || {}).map(([fname, m]) => (
                      <tr key={fname} style={{ borderBottom: '1px solid rgba(238, 240, 230, 0.05)' }}>
                        <td style={{ padding: '10px 8px', fontWeight: 600, color: 'var(--ink)' }}>{fname}</td>
                        <td style={{ padding: '10px 8px', color: 'var(--cyan)' }}>{m.ks_statistic.toFixed(4)}</td>
                        <td style={{ padding: '10px 8px', color: 'var(--ink-dim)' }}>{m.p_value}</td>
                        <td style={{ padding: '10px 8px', color: m.psi_score > 0.25 ? 'var(--danger)' : 'var(--phosphor)', fontWeight: 700 }}>
                          {m.psi_score.toFixed(4)}
                        </td>
                        <td style={{ padding: '10px 8px', color: 'var(--ink-dim)' }}>{m.wasserstein_distance.toFixed(4)}</td>
                        <td style={{ padding: '10px 8px' }}>
                          <span style={{
                            fontSize: '9px',
                            padding: '2px 6px',
                            borderRadius: '2px',
                            background: m.drift_detected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(184, 200, 96, 0.15)',
                            color: m.drift_detected ? 'var(--danger)' : 'var(--phosphor)',
                            fontWeight: 700
                          }}>
                            {m.drift_detected ? 'DRIFTED' : 'STABLE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Active Healing Workflow Progress if triggered */}
                {workflow && (
                  <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg)', border: '1px solid var(--hairline)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--cyan)', fontSize: '11px' }}>
                        ACTIVE ARGO WORKFLOW: {workflow.workflow_id}
                      </span>
                      <span style={{ color: 'var(--phosphor)', fontSize: '11px' }}>EST DURATION: {workflow.estimated_duration_sec}S</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {workflow.pipeline_stages.map((st, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-dim)' }}>
                          <span>{i+1}. {st.stage}</span>
                          <span style={{ color: st.status === 'COMPLETED' ? 'var(--phosphor)' : st.status === 'RUNNING' ? 'var(--accent)' : 'var(--ink-faint)', fontWeight: 600 }}>
                            [{st.status}]
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Canary & KEDA */}
            {activeTab === 'canary' && (
              <div className="brutalist-card" style={{ padding: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '16px' }}>
                  Istio VirtualService Traffic Routing & KEDA Autoscaler
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px' }}>
                      <span>Production (v2.4.1): 90%</span>
                      <span>Canary (v2.5.0-rc1): 10%</span>
                    </div>
                    <div style={{ height: '20px', display: 'flex', border: '1px solid var(--hairline)' }}>
                      <div style={{ width: '90%', background: 'var(--cyan)' }} />
                      <div style={{ width: '10%', background: 'var(--accent)' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginTop: '12px' }}>
                    <div style={{ padding: '12px', background: 'var(--bg)', border: '1px solid var(--hairline)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--ink-dim)' }}>CURRENT PODS</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--phosphor)' }}>8 REPLICAS</div>
                    </div>
                    <div style={{ padding: '12px', background: 'var(--bg)', border: '1px solid var(--hairline)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--ink-dim)' }}>GPU UTILIZATION</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cyan)' }}>82.4%</div>
                    </div>
                    <div style={{ padding: '12px', background: 'var(--bg)', border: '1px solid var(--hairline)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--ink-dim)' }}>ROLLBACK THRESHOLD</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--danger)' }}>&gt; 0.5% ERRORS</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: MLflow Registry */}
            {activeTab === 'registry' && (
              <div className="brutalist-card" style={{ padding: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '14px' }}>
                  MLflow Model Registry State
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { name: "production-fraud-detector", ver: "v2.4.1", stage: "Production", acc: "96.4%", traffic: "90%" },
                    { name: "candidate-fraud-detector", ver: "v2.5.0-rc1", stage: "Canary", acc: "97.8%", traffic: "10%" },
                    { name: "risk-scoring-regressor", ver: "v1.8.0", stage: "Production", acc: "94.1%", traffic: "100%" },
                  ].map(m => (
                    <div key={m.name} style={{ padding: '12px', background: 'var(--surface-raised)', border: '1px solid var(--hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{m.name} ({m.ver})</div>
                        <div style={{ fontSize: '10px', color: 'var(--ink-dim)' }}>Validation Accuracy: {m.acc}</div>
                      </div>
                      <span className="brutalist-badge" style={{
                        color: m.stage === 'Canary' ? 'var(--accent)' : 'var(--cyan)',
                        borderColor: m.stage === 'Canary' ? 'var(--accent)' : 'var(--cyan)'
                      }}>
                        {m.stage} ({m.traffic})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Logs */}
            {activeTab === 'logs' && (
              <div className="brutalist-card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '10px' }}>
                  Controller Event Stream
                </div>
                <div style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--hairline)',
                  padding: '14px',
                  fontSize: '11px',
                  color: 'var(--phosphor)',
                  height: '300px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  {logs.map((l, i) => (
                    <div key={i}>{l}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--hairline)',
        padding: '14px 24px',
        fontSize: '11px',
        color: 'var(--ink-dim)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg)'
      }}>
        <div>BERNARD BIRENDRA DAS // SYS_04 // ENTERPRISE MLOPS PLATFORM</div>
        <div style={{ display: 'flex', gap: '14px' }}>
          <span style={{ color: 'var(--accent)' }}>CLI: just backend | just frontend</span>
          <span style={{ color: 'var(--phosphor)' }}>SLA: 99.99% ZERO DOWNTIME</span>
        </div>
      </footer>
    </div>
  );
}
