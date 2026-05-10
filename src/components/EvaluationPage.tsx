import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function EvaluationPage() {
  const models = useQuery(api.training.getAllModels);
  const latestModel = models?.find(m => m.status === "ready");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Model Evaluation Dashboard</h1>
          </div>
          <p className="text-gray-500">
            Accuracy metrics, confusion matrix, precision/recall/F1-score, and model version comparison.
          </p>
        </div>

        {models === undefined ? (
          <EvalLoadingSkeleton />
        ) : models.length === 0 ? (
          <NoModelsState />
        ) : (
          <>
            {/* Latest Model Metrics */}
            {latestModel && latestModel.evaluationMetrics && (
              <LatestModelPanel model={latestModel} />
            )}

            {/* Model Version Comparison */}
            <ModelComparisonTable models={models} />
          </>
        )}

        {/* Academic Note */}
        <div className="mt-8 p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex gap-3">
          <span className="text-indigo-500 text-lg flex-shrink-0">🎓</span>
          <div className="text-sm text-indigo-700 space-y-1">
            <p><strong>Evaluation Methodology:</strong> Models are evaluated on a held-out 20% test split (not seen during training).</p>
            <p><strong>Metrics:</strong> Precision = TP/(TP+FP) · Recall = TP/(TP+FN) · F1 = 2·P·R/(P+R) · Accuracy = (TP+TN)/Total</p>
            <p><strong>Confusion Matrix:</strong> TP = correctly predicted Real, TN = correctly predicted Fake, FP = Fake predicted as Real, FN = Real predicted as Fake.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LatestModelPanel({ model }: { model: any }) {
  const m = model.evaluationMetrics;
  const stats = model.trainingStats;

  return (
    <div className="mb-8 space-y-6">
      {/* Model Info Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-indigo-200 text-sm font-medium">Latest Ready Model</span>
            </div>
            <h2 className="text-2xl font-bold">{model.name}</h2>
            <p className="text-indigo-200 text-sm mt-1">{model.version} · Trained {formatDate(model.trainedAt)}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{Math.round((model.accuracy ?? 0) * 100)}%</div>
            <div className="text-indigo-200 text-sm">Test Accuracy</div>
          </div>
        </div>
        {stats && (
          <div className="mt-4 pt-4 border-t border-indigo-500 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><div className="text-indigo-200">Train Samples</div><div className="font-semibold">{stats.totalSamples.toLocaleString()}</div></div>
            <div><div className="text-indigo-200">Fake Samples</div><div className="font-semibold">{stats.fakeSamples.toLocaleString()}</div></div>
            <div><div className="text-indigo-200">Real Samples</div><div className="font-semibold">{stats.trueSamples.toLocaleString()}</div></div>
            <div><div className="text-indigo-200">Training Time</div><div className="font-semibold">{(stats.trainingTime / 1000).toFixed(1)}s</div></div>
          </div>
        )}
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Precision" value={m.precision} description="TP / (TP + FP)" color="blue" />
        <MetricCard label="Recall" value={m.recall} description="TP / (TP + FN)" color="green" />
        <MetricCard label="F1 Score" value={m.f1Score} description="Harmonic mean P·R" color="purple" />
        <MetricCard label="Accuracy" value={model.accuracy ?? 0} description="(TP+TN) / Total" color="indigo" />
      </div>

      {/* Confusion Matrix + Bar Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ConfusionMatrix metrics={m} />
        <MetricsBarChart metrics={m} accuracy={model.accuracy ?? 0} />
      </div>
    </div>
  );
}

function MetricCard({ label, value, description, color }: { label: string; value: number; description: string; color: string }) {
  const pct = Math.round(value * 100);
  const colorMap: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    indigo: "from-indigo-500 to-indigo-600",
  };
  const bgMap: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    purple: "bg-purple-50 border-purple-200",
    indigo: "bg-indigo-50 border-indigo-200",
  };
  const textMap: Record<string, string> = {
    blue: "text-blue-700",
    green: "text-green-700",
    purple: "text-purple-700",
    indigo: "text-indigo-700",
  };

  return (
    <div className={`rounded-xl p-5 border ${bgMap[color]}`}>
      <div className="text-3xl font-bold text-gray-900 mb-1">{pct}%</div>
      <div className={`text-sm font-semibold ${textMap[color]} mb-1`}>{label}</div>
      <div className="text-xs text-gray-500 mb-3">{description}</div>
      {/* Progress bar */}
      <div className="h-2 bg-white rounded-full overflow-hidden border border-gray-200">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colorMap[color]} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ConfusionMatrix({ metrics }: { metrics: any }) {
  const { truePositives: tp, trueNegatives: tn, falsePositives: fp, falseNegatives: fn } = metrics;
  const total = tp + tn + fp + fn;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-800 mb-1">Confusion Matrix</h3>
      <p className="text-xs text-gray-400 mb-5">Predicted vs. Actual labels on test set</p>

      <div className="space-y-2">
        {/* Header row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div></div>
          <div className="text-xs font-semibold text-gray-500 py-1 bg-gray-50 rounded">Predicted Fake</div>
          <div className="text-xs font-semibold text-gray-500 py-1 bg-gray-50 rounded">Predicted Real</div>
        </div>
        {/* Actual Fake row */}
        <div className="grid grid-cols-3 gap-2 text-center items-center">
          <div className="text-xs font-semibold text-gray-500 text-right pr-2">Actual Fake</div>
          <div className="bg-green-100 border-2 border-green-300 rounded-xl p-4">
            <div className="text-2xl font-bold text-green-700">{tn}</div>
            <div className="text-xs text-green-600 font-medium mt-0.5">TN</div>
            <div className="text-xs text-gray-400">{total > 0 ? Math.round(tn / total * 100) : 0}%</div>
          </div>
          <div className="bg-red-100 border-2 border-red-200 rounded-xl p-4">
            <div className="text-2xl font-bold text-red-600">{fp}</div>
            <div className="text-xs text-red-500 font-medium mt-0.5">FP</div>
            <div className="text-xs text-gray-400">{total > 0 ? Math.round(fp / total * 100) : 0}%</div>
          </div>
        </div>
        {/* Actual Real row */}
        <div className="grid grid-cols-3 gap-2 text-center items-center">
          <div className="text-xs font-semibold text-gray-500 text-right pr-2">Actual Real</div>
          <div className="bg-red-100 border-2 border-red-200 rounded-xl p-4">
            <div className="text-2xl font-bold text-red-600">{fn}</div>
            <div className="text-xs text-red-500 font-medium mt-0.5">FN</div>
            <div className="text-xs text-gray-400">{total > 0 ? Math.round(fn / total * 100) : 0}%</div>
          </div>
          <div className="bg-green-100 border-2 border-green-300 rounded-xl p-4">
            <div className="text-2xl font-bold text-green-700">{tp}</div>
            <div className="text-xs text-green-600 font-medium mt-0.5">TP</div>
            <div className="text-xs text-gray-400">{total > 0 ? Math.round(tp / total * 100) : 0}%</div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-500">
        <span>Total test samples: <strong>{total}</strong></span>
        <span>Correct: <strong className="text-green-600">{tp + tn}</strong> · Wrong: <strong className="text-red-500">{fp + fn}</strong></span>
      </div>
    </div>
  );
}

function MetricsBarChart({ metrics, accuracy }: { metrics: any; accuracy: number }) {
  const bars = [
    { label: "Accuracy", value: accuracy, color: "bg-indigo-500" },
    { label: "Precision", value: metrics.precision, color: "bg-blue-500" },
    { label: "Recall", value: metrics.recall, color: "bg-green-500" },
    { label: "F1 Score", value: metrics.f1Score, color: "bg-purple-500" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-800 mb-1">Metrics Overview</h3>
      <p className="text-xs text-gray-400 mb-6">All metrics on held-out 20% test set</p>

      <div className="space-y-5">
        {bars.map(bar => (
          <div key={bar.label}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm font-medium text-gray-700">{bar.label}</span>
              <span className="text-sm font-bold text-gray-900">{Math.round(bar.value * 100)}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${bar.color} transition-all duration-700`}
                style={{ width: `${Math.round(bar.value * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Interpretation */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 font-medium mb-2">Interpretation</p>
        <div className="space-y-1 text-xs text-gray-500">
          <p>• <strong>High Precision</strong> → few false alarms (real news flagged as fake)</p>
          <p>• <strong>High Recall</strong> → few misses (fake news not caught)</p>
          <p>• <strong>F1 ≥ 0.90</strong> → excellent balance for production use</p>
        </div>
      </div>
    </div>
  );
}

function ModelComparisonTable({ models }: { models: any[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <h2 className="font-semibold text-gray-800">Model Version History</h2>
        <p className="text-xs text-gray-400 mt-0.5">Compare all trained model versions</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Version</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Accuracy</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Precision</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Recall</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">F1 Score</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Samples</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trained</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {models.map((model, idx) => (
              <tr key={model._id} className={`hover:bg-gray-50 transition-colors ${idx === 0 ? "bg-indigo-50/30" : ""}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {idx === 0 && <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">Latest</span>}
                    <span className="text-sm font-mono text-gray-600">{model.version.slice(0, 14)}…</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={model.status} />
                </td>
                <td className="px-6 py-4">
                  <MetricCell value={model.accuracy} />
                </td>
                <td className="px-6 py-4">
                  <MetricCell value={model.evaluationMetrics?.precision} />
                </td>
                <td className="px-6 py-4">
                  <MetricCell value={model.evaluationMetrics?.recall} />
                </td>
                <td className="px-6 py-4">
                  <MetricCell value={model.evaluationMetrics?.f1Score} highlight />
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {model.trainingStats ? model.trainingStats.totalSamples.toLocaleString() : "—"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">{formatDate(model.trainedAt)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCell({ value, highlight = false }: { value?: number; highlight?: boolean }) {
  if (value === undefined || value === null) return <span className="text-gray-400 text-sm">—</span>;
  const pct = Math.round(value * 100);
  const color = pct >= 90 ? "text-green-600" : pct >= 75 ? "text-yellow-600" : "text-red-500";
  return (
    <span className={`text-sm font-semibold ${color} ${highlight ? "text-base" : ""}`}>
      {pct}%
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ready") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>Ready
    </span>
  );
  if (status === "training") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>Training
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>Failed
    </span>
  );
}

function EvalLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse bg-white rounded-2xl h-40 border border-gray-100"></div>
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="animate-pulse bg-white rounded-xl h-28 border border-gray-100"></div>)}
      </div>
    </div>
  );
}

function NoModelsState() {
  return (
    <div className="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="w-20 h-20 mx-auto rounded-full bg-indigo-50 flex items-center justify-center text-4xl mb-4">
        🤖
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">No trained models yet</h3>
      <p className="text-gray-400 text-sm max-w-sm mx-auto">
        Train a model from the Training page (accessible via <code className="bg-gray-100 px-1 rounded">/#/training</code>) to see evaluation metrics here.
      </p>
    </div>
  );
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
