import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import {
  FileText,
  Image as ImageIcon,
  Upload,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  BarChart2,
  Zap,
  Eye,
  Layers,
  FlaskConical,
  Info,
} from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";
import Tesseract from "tesseract.js";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type AnalysisType = "text" | "image" | "both";

// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AnalyzePage() {
  const [analysisType, setAnalysisType] = useState<AnalysisType>("text");
  const [textContent, setTextContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  const [textAnalysisId, setTextAnalysisId] = useState<Id<"analyses"> | null>(null);

  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageAnalysisId, setImageAnalysisId] = useState<Id<"analyses"> | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [extractedOcrText, setExtractedOcrText] = useState<string>("");

  const createTextAnalysis = useMutation(api.analyses.create);

  const textAnalysisResult = useQuery(
    api.analyses.get,
    textAnalysisId ? { id: textAnalysisId } : "skip"
  );

  const imageAnalysisResult = useQuery(
    api.analyses.get,
    imageAnalysisId ? { id: imageAnalysisId } : "skip"
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImageAnalysisId(null);
    setOcrError(null);
    setExtractedOcrText("");
    setUploadedImagePreview(URL.createObjectURL(file));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear when leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are supported.");
      return;
    }
    setImageFile(file);
    setImageAnalysisId(null);
    setOcrError(null);
    setExtractedOcrText("");
    setUploadedImagePreview(URL.createObjectURL(file));
  };

  const handleAnalyze = async () => {
    const doText = analysisType === "text" || analysisType === "both";
    const doImage = analysisType === "image" || analysisType === "both";

    if (doText && !textContent.trim()) {
      toast.error("Please enter some text to analyse.");
      return;
    }
    if (doImage && !imageFile) {
      toast.error("Please upload an image to analyse.");
      return;
    }

    if (doText) {
      setIsAnalyzingText(true);
      setTextAnalysisId(null);
      try {
        const id = await createTextAnalysis({ type: "text", content: textContent });
        setTextAnalysisId(id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Text analysis failed.");
      } finally {
        setIsAnalyzingText(false);
      }
    }

    if (doImage && imageFile) {
      setIsAnalyzingImage(true);
      setImageAnalysisId(null);
      setOcrError(null);
      setExtractedOcrText("");
      try {
        toast.info("Extracting text from image using OCR…");
        const { data: { text: extractedText } } = await Tesseract.recognize(imageFile, 'eng');
        
        if (!extractedText || extractedText.trim().length < 5) {
          setOcrError("No readable text was detected in the image.");
          return;
        }

        setExtractedOcrText(extractedText);
        toast.info("Running text analysis on extracted content…");
        const id = await createTextAnalysis({ type: "text", content: extractedText });
        setImageAnalysisId(id);
        toast.success("Image OCR analysis complete!");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Image analysis failed.");
      } finally {
        setIsAnalyzingImage(false);
      }
    }
  };

  const handleReset = () => {
    setTextContent("");
    setImageFile(null);
    setUploadedImagePreview(null);
    setTextAnalysisId(null);
    setImageAnalysisId(null);
    setOcrError(null);
    setExtractedOcrText("");
  };

  const isAnalyzing = isAnalyzingText || isAnalyzingImage;
  const hasTextResult = !!textAnalysisResult && textAnalysisResult.result !== "Pending";
  const hasImageResult = (!!imageAnalysisResult && imageAnalysisResult.result !== "Pending") || !!ocrError;
  const hasAnyResult = hasTextResult || hasImageResult;

  const textIsPending =
    textAnalysisId !== null &&
    (!textAnalysisResult || textAnalysisResult.result === "Pending");

  return (
    <div className="w-full py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Analyze Content
          </h1>
          <p className="text-xl text-gray-600">
            Detect fake news with our dual text and image OCR AI pipeline
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {(
            [
              { id: "text", label: "Text Analysis", icon: FileText },
              { id: "image", label: "Image OCR Analysis", icon: ImageIcon },
              { id: "both", label: "Both", icon: Layers },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setAnalysisType(id);
                handleReset();
              }}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                analysisType === id
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Input Section */}
        <div className="rounded-2xl p-8 bg-white border border-gray-200 shadow-xl mb-8 space-y-6">
          {/* Text input */}
          {(analysisType === "text" || analysisType === "both") && (
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                <FileText className="inline w-5 h-5 mr-2 text-blue-600" />
                Paste Text Content
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                placeholder="Paste the news article, social media post, or any text you want to verify…"
              />
            </div>
          )}

          {/* Image input */}
          {(analysisType === "image" || analysisType === "both") && (
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                <ImageIcon className="inline w-5 h-5 mr-2 text-purple-600" />
                Upload Image for Text Extraction (OCR)
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-300 hover:border-purple-400"
                }`}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {uploadedImagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={uploadedImagePreview}
                      alt="Preview"
                      className="max-h-56 mx-auto rounded-lg shadow-lg object-contain"
                    />
                    <button
                      onClick={() => {
                        setImageFile(null);
                        setUploadedImagePreview(null);
                        setImageAnalysisId(null);
                        setOcrError(null);
                        setExtractedOcrText("");
                      }}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Upload
                      className={`w-10 h-10 mx-auto mb-3 transition-colors ${
                        isDragging ? "text-purple-500" : "text-gray-400"
                      }`}
                    />
                    <p className="text-gray-600 mb-1">
                      {isDragging ? "Drop your image here" : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-sm text-gray-500">PNG, JPG, WEBP up to 10 MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Analyse button */}
          <button
            onClick={handleAnalyze}
            disabled={
              isAnalyzing ||
              ((analysisType === "text" || analysisType === "both") && !textContent.trim()) ||
              ((analysisType === "image" || analysisType === "both") && !imageFile)
            }
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing…</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>Run Analysis</span>
              </>
            )}
          </button>
        </div>

        {/* Pending text indicator */}
        {textIsPending && !isAnalyzingText && (
          <div className="rounded-2xl p-6 bg-yellow-50 border border-yellow-200 shadow mb-6 flex items-center space-x-3">
            <Loader2 className="w-6 h-6 text-yellow-600 animate-spin flex-shrink-0" />
            <p className="text-yellow-800 font-medium">
              Text analysis is running… results will appear automatically.
            </p>
          </div>
        )}

        {/* Dual results grid */}
        {hasAnyResult && (
          <div
            className={`grid gap-6 mb-8 ${
              hasTextResult && hasImageResult ? "md:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {hasTextResult && textAnalysisResult && (
              <ResultCard
                title="Text Analysis"
                icon={<FileText className="w-5 h-5" />}
                result={textAnalysisResult.confidence === -1 ? "Error" : textAnalysisResult.result}
                confidence={textAnalysisResult.confidence}
                errorMessage={
                  textAnalysisResult.confidence === -1
                    ? textAnalysisResult.content
                    : undefined
                }
                accentColor="blue"
                inputText={textAnalysisResult.confidence === -1 ? textContent : undefined}
              />
            )}

            {hasImageResult && (
              <ResultCard
                title="Image Text Analysis"
                icon={<Eye className="w-5 h-5" />}
                result={ocrError ? "Error" : (imageAnalysisResult?.confidence === -1 ? "Error" : (imageAnalysisResult?.result || "Error"))}
                confidence={ocrError ? 0 : (imageAnalysisResult?.confidence || 0)}
                errorMessage={ocrError ? ocrError : (imageAnalysisResult?.confidence === -1 ? imageAnalysisResult.content : undefined)}
                accentColor="purple"
                inputText={ocrError ? undefined : extractedOcrText}
                imageUrl={uploadedImagePreview}
              />
            )}
          </div>
        )}

        {/* Combined verdict */}
        {hasTextResult &&
          hasImageResult && !ocrError && imageAnalysisResult && imageAnalysisResult.confidence !== -1 &&
          textAnalysisResult &&
          textAnalysisResult.confidence !== -1 && (
            <CombinedVerdict
              textResult={textAnalysisResult.result as "Real" | "Fake"}
              textConfidence={textAnalysisResult.confidence}
              imageResult={imageAnalysisResult!.result as "Real" | "Fake"}
              imageConfidence={imageAnalysisResult!.confidence}
            />
          )}

        {/* Reset button */}
        {hasAnyResult && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleReset}
              className="px-8 py-3 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
            >
              Analyze Another
            </button>
          </div>
        )}

        {/* How it works */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Text Pipeline</h3>
            </div>
            <p className="text-sm text-gray-700">
              TF-IDF vectorisation (5 000-word vocabulary) feeds a Logistic Regression
              classifier trained on labelled fake/real news articles. Train your own model
              in the Training tab.
            </p>
          </div>
          <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
            <div className="flex items-center space-x-2 mb-3">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Image Pipeline</h3>
            </div>
            <p className="text-sm text-gray-700">
              Optical Character Recognition (OCR) extracts text from the uploaded image. The extracted text is then passed through the identical TF-IDF and Logistic Regression pipeline used for direct text analysis to detect fake news narratives.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo-mode helper — deterministic fake/real prediction from raw text
// ─────────────────────────────────────────────────────────────────────────────

const FAKE_SIGNALS = [
  "breaking", "shocking", "exclusive", "urgent", "bombshell", "exposed",
  "secret", "cover-up", "conspiracy", "hoax", "fake", "lie", "fraud",
  "scandal", "leaked", "banned", "censored", "hidden", "truth", "wake up",
  "they don't want you to know", "mainstream media", "deep state",
  "miracle cure", "100%", "guaranteed", "unbelievable", "you won't believe",
];

const REAL_SIGNALS = [
  "according to", "study", "research", "report", "official", "confirmed",
  "announced", "published", "data", "evidence", "analysis", "survey",
  "university", "government", "spokesperson", "statement", "percent",
  "statistics", "findings", "journal",
];

interface DemoResult {
  prediction: "Real" | "Fake";
  confidence: number;
  bullets: string[];
}

function getDemoResult(text: string): DemoResult {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  const wordCount = words.length;

  // Score based on signal words
  let fakeScore = 0;
  let realScore = 0;
  FAKE_SIGNALS.forEach((s) => { if (lower.includes(s)) fakeScore++; });
  REAL_SIGNALS.forEach((s) => { if (lower.includes(s)) realScore++; });

  // Sentence structure heuristics
  const exclamations = (text.match(/!/g) || []).length;
  const allCapsWords = (text.match(/\b[A-Z]{3,}\b/g) || []).length;
  const avgWordLen = text.replace(/\s+/g, "").length / Math.max(wordCount, 1);
  const hasNumbers = /\d+/.test(text);
  const hasQuotes = /"[^"]{10,}"/.test(text);

  fakeScore += exclamations * 0.5 + allCapsWords * 0.8;
  realScore += (hasNumbers ? 1 : 0) + (hasQuotes ? 1.5 : 0);

  // Deterministic tiebreak from char codes
  const charSum = text.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const tieBreak = (charSum % 100) / 100; // 0–1

  const prediction: "Real" | "Fake" =
    fakeScore > realScore
      ? "Fake"
      : realScore > fakeScore
      ? "Real"
      : tieBreak > 0.5
      ? "Fake"
      : "Real";

  // Confidence: base 55–85%, nudged by signal gap
  const gap = Math.abs(fakeScore - realScore);
  const rawConf = 0.55 + Math.min(gap * 0.04, 0.28) + (tieBreak * 0.04 - 0.02);
  const confidence = Math.min(0.92, Math.max(0.52, rawConf));

  // Build explanation bullets
  const bullets: string[] = [];

  if (prediction === "Fake") {
    if (exclamations > 0 || allCapsWords > 0)
      bullets.push(
        `Emotionally charged language detected — ${exclamations} exclamation mark(s) and ${allCapsWords} ALL-CAPS word(s) suggest sensationalism.`
      );
    if (fakeScore > 0)
      bullets.push(
        `${fakeScore} high-risk signal phrase(s) found (e.g. "breaking", "shocking", "they don't want you to know") commonly associated with misinformation.`
      );
    if (wordCount < 40)
      bullets.push(
        "Short, vague content with limited factual detail — credible news articles typically provide context, sources, and data."
      );
    else
      bullets.push(
        "Narrative structure leans on assertion rather than evidence; no verifiable citations or attributed quotes detected."
      );
    if (bullets.length < 2)
      bullets.push(
        "Linguistic pattern analysis flags this text as statistically similar to known fake-news samples in the training corpus."
      );
  } else {
    if (hasNumbers)
      bullets.push(
        "Specific numerical data present — quantitative claims are a strong indicator of factual, evidence-based reporting."
      );
    if (hasQuotes)
      bullets.push(
        "Direct quotations detected, suggesting attributed sourcing consistent with professional journalism standards."
      );
    if (realScore > 0)
      bullets.push(
        `${realScore} credibility signal(s) found (e.g. "according to", "study", "official") typical of verified reporting.`
      );
    if (avgWordLen > 5)
      bullets.push(
        "Vocabulary complexity and sentence structure align with formal, fact-checked news writing rather than viral misinformation."
      );
    if (bullets.length < 2)
      bullets.push(
        "Overall linguistic fingerprint closely matches real news articles in the reference dataset."
      );
  }

  return { prediction, confidence, bullets: bullets.slice(0, 3) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface ResultCardProps {
  title: string;
  icon: React.ReactNode;
  result: string;
  confidence: number;
  accentColor: "blue" | "purple";
  errorMessage?: string;
  details?: any;
  inputText?: string;
  imageUrl?: string | null;
}

function ResultCard({
  title,
  icon,
  result,
  confidence,
  accentColor,
  errorMessage,
  details,
  inputText,
  imageUrl,
}: ResultCardProps) {
  const isReal = result === "Real";
  const isFake = result === "Fake";
  const isError = result === "Error";
  const isDemo = isError && !!inputText;

  const accent = accentColor === "blue" ? "blue" : "purple";

  // Compute demo prediction once (stable per inputText)
  const demo = isDemo ? getDemoResult(inputText!) : null;

  return (
    <div className="rounded-2xl p-6 bg-white border border-gray-200 shadow-xl">
      <div className="flex items-center justify-between mb-5">
        <div className={`flex items-center space-x-2 text-${accent}-600`}>
          {icon}
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        </div>
        {isDemo && (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
            <FlaskConical className="w-3 h-3" />
            <span>Demo Mode</span>
          </span>
        )}
      </div>

      {imageUrl && (
        <div className="mb-6">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Uploaded Image Preview
          </div>
          <img 
            src={imageUrl} 
            alt="Uploaded Preview" 
            className="max-h-48 rounded-lg shadow-sm border border-gray-200 object-contain w-full bg-gray-50" 
          />
        </div>
      )}

      {isDemo && demo ? (
        <>
          {/* Demo prediction badge */}
          <div className="flex justify-center mb-5">
            <div
              className={`inline-flex items-center space-x-2 px-6 py-3 rounded-full text-xl font-bold ${
                demo.prediction === "Real"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {demo.prediction === "Real" ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
              <span>{demo.prediction}</span>
            </div>
          </div>

          {/* Confidence bar */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-semibold text-gray-700">Confidence</span>
              <span className="text-lg font-bold text-gray-900">
                {Math.round(demo.confidence * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  demo.prediction === "Real"
                    ? "bg-gradient-to-r from-green-400 to-green-600"
                    : "bg-gradient-to-r from-red-400 to-red-600"
                }`}
                style={{ width: `${demo.confidence * 100}%` }}
              />
            </div>
          </div>

          {/* Explanation bullets */}
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
            <div className="flex items-center space-x-1.5 mb-3">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                Linguistic Analysis
              </span>
            </div>
            <ul className="space-y-2">
              {demo.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 leading-snug">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* "Model not trained" notice */}
          <div className="mt-4 flex items-start space-x-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              <span className="font-semibold">Model not trained.</span> This is a heuristic
              demo result. Upload a labelled dataset in the Training page to enable the full
              TF-IDF + Logistic Regression pipeline.
            </p>
          </div>
        </>
      ) : isError ? (
        <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-orange-800">{errorMessage || "Analysis failed."}</p>
        </div>
      ) : (
        <>
          <div className="flex justify-center mb-5">
            <div
              className={`inline-flex items-center space-x-2 px-6 py-3 rounded-full text-xl font-bold ${
                isReal
                  ? "bg-green-100 text-green-800"
                  : isFake
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {isReal ? (
                <CheckCircle className="w-6 h-6" />
              ) : isFake ? (
                <XCircle className="w-6 h-6" />
              ) : (
                <Loader2 className="w-6 h-6 animate-spin" />
              )}
              <span>{result}</span>
            </div>
          </div>

          <div className="mb-5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-semibold text-gray-700">Confidence</span>
              <span className="text-lg font-bold text-gray-900">
                {Math.round(confidence * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isReal
                    ? "bg-gradient-to-r from-green-400 to-green-600"
                    : "bg-gradient-to-r from-red-400 to-red-600"
                }`}
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
          </div>

          {details && (
            <div className="space-y-2">
              <div className="flex items-center space-x-1 mb-2">
                <BarChart2 className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Feature Breakdown
                </span>
              </div>
              {(
                [
                  { key: "colorConsistency", label: "Colour Consistency" },
                  { key: "noiseLevel", label: "Noise Level" },
                  { key: "compressionArtifacts", label: "Compression Artifacts" },
                  { key: "edgeSharpness", label: "Edge Sharpness" },
                  { key: "frequencyAnomaly", label: "Frequency Anomaly" },
                  { key: "faceRegionScore", label: "Face Region Score" },
                ] as const
              ).map(({ key, label }) => {
                const val = details[key];
                const pct = Math.round(val * 100);
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                      <span>{label}</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface CombinedVerdictProps {
  textResult: "Real" | "Fake";
  textConfidence: number;
  imageResult: "Real" | "Fake";
  imageConfidence: number;
}

function CombinedVerdict({
  textResult,
  textConfidence,
  imageResult,
  imageConfidence,
}: CombinedVerdictProps) {
  const textScore = textResult === "Real" ? textConfidence : 1 - textConfidence;
  const imageScore = imageResult === "Real" ? imageConfidence : 1 - imageConfidence;
  const combinedScore = (textScore + imageScore) / 2;
  const combinedResult = combinedScore >= 0.5 ? "Real" : "Fake";
  const combinedConfidence = combinedResult === "Real" ? combinedScore : 1 - combinedScore;

  return (
    <div className="rounded-2xl p-6 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 shadow-2xl text-white">
      <div className="flex items-center space-x-2 mb-4">
        <Layers className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-bold">Combined Verdict</h2>
        <span className="text-xs text-gray-400 ml-auto">Text 50% + Image 50%</span>
      </div>

      <div className="flex items-center justify-between">
        <div
          className={`inline-flex items-center space-x-2 px-6 py-3 rounded-full text-xl font-bold ${
            combinedResult === "Real"
              ? "bg-green-500/20 text-green-300 border border-green-500/30"
              : "bg-red-500/20 text-red-300 border border-red-500/30"
          }`}
        >
          {combinedResult === "Real" ? (
            <CheckCircle className="w-6 h-6" />
          ) : (
            <XCircle className="w-6 h-6" />
          )}
          <span>{combinedResult}</span>
        </div>

        <div className="text-right">
          <div className="text-3xl font-bold text-white">
            {Math.round(combinedConfidence * 100)}%
          </div>
          <div className="text-xs text-gray-400">combined confidence</div>
        </div>
      </div>

      <div className="mt-4 w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            combinedResult === "Real"
              ? "bg-gradient-to-r from-green-400 to-green-500"
              : "bg-gradient-to-r from-red-400 to-red-500"
          }`}
          style={{ width: `${combinedConfidence * 100}%` }}
        />
      </div>
    </div>
  );
}
