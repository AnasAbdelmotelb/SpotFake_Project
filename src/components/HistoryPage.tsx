import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function HistoryPage() {
  const analyses = useQuery(api.analyses.listAll);

  const fakeCount = analyses?.filter(a => a.result === "Fake").length ?? 0;
  const realCount = analyses?.filter(a => a.result === "Real").length ?? 0;
  const pendingCount = analyses?.filter(a => a.result === "Pending").length ?? 0;
  const avgConfidence = analyses && analyses.length > 0
    ? analyses.filter(a => a.confidence > 0).reduce((sum, a) => sum + a.confidence, 0) /
      Math.max(analyses.filter(a => a.confidence > 0).length, 1)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Analysis History</h1>
          </div>
          <p className="text-gray-500 ml-13">
            Complete log of all text and image analyses with verdicts, confidence scores, and explainability data.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Analyses"
            value={analyses?.length ?? "—"}
            icon="📊"
            color="from-blue-500 to-blue-600"
          />
          <StatCard
            label="Fake Detected"
            value={fakeCount}
            icon="🚨"
            color="from-red-500 to-red-600"
          />
          <StatCard
            label="Real Verified"
            value={realCount}
            icon="✅"
            color="from-green-500 to-green-600"
          />
          <StatCard
            label="Avg Confidence"
            value={`${Math.round(avgConfidence * 100)}%`}
            icon="🎯"
            color="from-purple-500 to-purple-600"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">All Analyses</h2>
            {analyses && (
              <span className="text-sm text-gray-400">{analyses.length} records</span>
            )}
          </div>

          {analyses === undefined ? (
            <LoadingSkeleton />
          ) : analyses.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Content Preview</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Verdict</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Confidence</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Key Signals</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {analyses.map((analysis) => (
                    <AnalysisRow key={analysis._id} analysis={analysis} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Academic Note */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3">
          <span className="text-blue-500 text-lg flex-shrink-0">ℹ️</span>
          <p className="text-sm text-blue-700">
            <strong>Academic Note:</strong> All analyses are persisted in real-time to the Convex database with full metadata.
            The "Key Signals" column shows the top TF-IDF weighted words that most influenced the model's decision (text analyses only).
            Positive scores push toward <em>Real</em>; negative scores push toward <em>Fake</em>.
          </p>
        </div>
      </div>
    </div>
  );
}

function AnalysisRow({ analysis }: { analysis: any }) {
  const isImage = analysis.type === "image";
  const isPending = analysis.result === "Pending";
  const isFake = analysis.result === "Fake";
  const isReal = analysis.result === "Real";

  const confidencePct = analysis.confidence > 0 ? Math.round(analysis.confidence * 100) : null;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Type */}
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          isImage
            ? "bg-purple-100 text-purple-700"
            : "bg-blue-100 text-blue-700"
        }`}>
          {isImage ? "🖼️ Image" : "📝 Text"}
        </span>
      </td>

      {/* Content Preview */}
      <td className="px-6 py-4 max-w-xs">
        <p className="text-sm text-gray-700 truncate" title={analysis.content}>
          {isImage ? (
            <span className="text-gray-400 italic">Image analysis</span>
          ) : (
            analysis.content.slice(0, 80) + (analysis.content.length > 80 ? "…" : "")
          )}
        </p>
      </td>

      {/* Verdict */}
      <td className="px-6 py-4">
        {isPending ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
            Pending
          </span>
        ) : isFake ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
            🚨 Fake
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
            ✅ Real
          </span>
        )}
      </td>

      {/* Confidence */}
      <td className="px-6 py-4">
        {confidencePct !== null ? (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isFake ? "bg-red-500" : "bg-green-500"}`}
                style={{ width: `${confidencePct}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-700">{confidencePct}%</span>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        )}
      </td>

      {/* Key Signals (Explainability) */}
      <td className="px-6 py-4">
        {analysis.topWords && analysis.topWords.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {analysis.topWords.slice(0, 4).map((w: { word: string; score: number }, i: number) => (
              <span
                key={i}
                className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                  w.score > 0
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
                title={`Weight: ${w.score > 0 ? "+" : ""}${w.score}`}
              >
                {w.word}
              </span>
            ))}
          </div>
        ) : isImage && analysis.imageAnalysisDetails ? (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {Object.entries(analysis.imageAnalysisDetails)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 3)
              .map(([key, val]) => (
                <span key={key} className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-mono">
                  {key.replace(/([A-Z])/g, ' $1').trim().split(' ')[0].toLowerCase()}:{Math.round((val as number) * 100)}
                </span>
              ))}
          </div>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </td>

      {/* Timestamp */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-600">{formatDate(analysis.timestamp)}</div>
        <div className="text-xs text-gray-400">{formatTime(analysis.timestamp)}</div>
      </td>
    </tr>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center text-lg mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="animate-pulse flex gap-4">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded flex-1"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-4xl mb-4">
        📋
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">No analyses yet</h3>
      <p className="text-gray-400 text-sm max-w-sm mx-auto">
        Run your first text or image analysis to see results here with full explainability data.
      </p>
    </div>
  );
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
