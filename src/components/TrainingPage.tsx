import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Upload, Database, Brain, CheckCircle, XCircle, Loader2, FileText, TrendingUp } from "lucide-react";

export default function TrainingPage() {
  const [fakeFile, setFakeFile] = useState<File | null>(null);
  const [trueFile, setTrueFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  const fakeInputRef = useRef<HTMLInputElement>(null);
  const trueInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.training.generateUploadUrl);
  const uploadTrainingFile = useMutation(api.training.uploadTrainingFile);
  const startTraining = useMutation(api.training.startTraining);
  const trainingFiles = useQuery(api.training.getTrainingFiles);
  const models = useQuery(api.training.getAllModels);
  const latestModel = useQuery(api.training.getLatestModel);

  const handleFileUpload = async (file: File, type: "fake" | "true") => {
    setIsUploading(true);
    try {
      // Read and parse CSV to count records
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const recordCount = Math.max(0, lines.length - 1); // Subtract header

      // Step 1: Get a short-lived upload URL from Convex storage
      const uploadUrl = await generateUploadUrl();

      // Step 2: POST the file directly to Convex storage
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: file,
      });

      if (!uploadResult.ok) {
        throw new Error(`Upload failed: ${uploadResult.statusText}`);
      }

      const { storageId } = await uploadResult.json();

      // Step 3: Save the storage ID + metadata to the database
      await uploadTrainingFile({
        type,
        storageId,
        fileName: file.name,
        recordCount,
      });

      toast.success(`${type === "fake" ? "Fake.csv" : "True.csv"} uploaded! (${recordCount.toLocaleString()} records)`);

      if (type === "fake") setFakeFile(null);
      else setTrueFile(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartTraining = async () => {
    setIsTraining(true);
    try {
      await startTraining({});
      toast.success("Training started! This may take a few minutes...");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to start training";
      toast.error(errorMessage);
      setIsTraining(false);
    }
  };

  // Check if training is complete
  const trainingModel = models?.find(m => m.status === "training");
  if (trainingModel && isTraining) {
    // Still training
  } else if (isTraining && !trainingModel) {
    // Training completed
    setIsTraining(false);
  }

  const fakeFileData = trainingFiles?.find(f => f.type === "fake");
  const trueFileData = trainingFiles?.find(f => f.type === "true");
  const canTrain = fakeFileData && trueFileData && !isTraining;

  return (
    <div className="w-full py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Model Training
          </h1>
          <p className="text-xl text-gray-600">
            Upload training datasets and train your custom fake news detection model
          </p>
        </div>

        {/* Current Model Status */}
        {latestModel && (
          <div className="mb-8 rounded-2xl p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Active Model: {latestModel.name} ({latestModel.version})
                </h3>
                {latestModel.trainingStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Accuracy:</span>
                      <span className="ml-2 font-semibold text-green-600">
                        {Math.round((latestModel.accuracy || 0) * 100)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Samples:</span>
                      <span className="ml-2 font-semibold">
                        {latestModel.trainingStats.totalSamples.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Training Time:</span>
                      <span className="ml-2 font-semibold">
                        {Math.round(latestModel.trainingStats.trainingTime / 1000)}s
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className="ml-2 font-semibold text-green-600">Ready</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Fake.csv Upload */}
          <div className="rounded-2xl p-8 bg-white border border-gray-200 shadow-xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Fake News Dataset</h2>
                <p className="text-sm text-gray-600">Upload Fake.csv</p>
              </div>
            </div>

            {fakeFileData ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-900">{fakeFileData.fileName}</p>
                      <p className="text-sm text-gray-600">{fakeFileData.recordCount.toLocaleString()} records</p>
                    </div>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            ) : (
              <div>
                <input
                  ref={fakeInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setFakeFile(file);
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => fakeInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-red-400 transition-colors"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Click to upload Fake.csv</p>
                  <p className="text-sm text-gray-500">CSV file with fake news samples</p>
                </button>

                {fakeFile && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Selected: {fakeFile.name}</p>
                    <button
                      onClick={() => handleFileUpload(fakeFile, "fake")}
                      disabled={isUploading}
                      className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {isUploading ? "Uploading..." : "Upload Fake Dataset"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* True.csv Upload */}
          <div className="rounded-2xl p-8 bg-white border border-gray-200 shadow-xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Real News Dataset</h2>
                <p className="text-sm text-gray-600">Upload True.csv</p>
              </div>
            </div>

            {trueFileData ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-900">{trueFileData.fileName}</p>
                      <p className="text-sm text-gray-600">{trueFileData.recordCount.toLocaleString()} records</p>
                    </div>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            ) : (
              <div>
                <input
                  ref={trueInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setTrueFile(file);
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => trueInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Click to upload True.csv</p>
                  <p className="text-sm text-gray-500">CSV file with real news samples</p>
                </button>

                {trueFile && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Selected: {trueFile.name}</p>
                    <button
                      onClick={() => handleFileUpload(trueFile, "true")}
                      disabled={isUploading}
                      className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {isUploading ? "Uploading..." : "Upload Real Dataset"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Training Section */}
        <div className="rounded-2xl p-8 bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Train Model</h2>
              <p className="text-sm text-gray-600">Create a custom fake news detection model</p>
            </div>
          </div>

          {isTraining || trainingModel ? (
            <div className="text-center py-8">
              <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Training in Progress...</h3>
              <p className="text-gray-600">
                This may take several minutes depending on dataset size. The model will be ready soon!
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Training Process:</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">1.</span>
                    <span>Data preprocessing and text vectorization using TF-IDF</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">2.</span>
                    <span>Training Logistic Regression classifier with SGD optimization</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">3.</span>
                    <span>Model evaluation and accuracy calculation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">4.</span>
                    <span>Saving trained model artifacts for inference</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleStartTraining}
                disabled={!canTrain}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
              >
                <Brain className="w-5 h-5" />
                <span>{canTrain ? "Start Training" : "Upload Both Datasets First"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Training History */}
        {models && models.length > 0 && (
          <div className="mt-8 rounded-2xl p-8 bg-white border border-gray-200 shadow-xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Training History</h2>
                <p className="text-sm text-gray-600">Previous model training sessions</p>
              </div>
            </div>

            <div className="space-y-4">
              {models.map((model) => (
                <div
                  key={model._id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        model.status === "ready" ? "bg-green-500" :
                        model.status === "training" ? "bg-yellow-500 animate-pulse" :
                        "bg-red-500"
                      }`} />
                      <span className="font-semibold text-gray-900">
                        {model.name} ({model.version})
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${
                      model.status === "ready" ? "text-green-600" :
                      model.status === "training" ? "text-yellow-600" :
                      "text-red-600"
                    }`}>
                      {model.status.toUpperCase()}
                    </span>
                  </div>
                  {model.trainingStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>Accuracy: <span className="font-semibold">{Math.round((model.accuracy || 0) * 100)}%</span></div>
                      <div>Samples: <span className="font-semibold">{model.trainingStats.totalSamples.toLocaleString()}</span></div>
                      <div>Time: <span className="font-semibold">{Math.round(model.trainingStats.trainingTime / 1000)}s</span></div>
                      <div>Date: <span className="font-semibold">{new Date(model.trainedAt).toLocaleDateString()}</span></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-2">Academic Evaluation Notes</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Upload your Fake.csv and True.csv datasets (CSV format with text column)</li>
            <li>• The system will train a Logistic Regression classifier with TF-IDF vectorization</li>
            <li>• Trained model artifacts (model.pkl and vectorizer.pkl) are saved to Convex storage</li>
            <li>• Once training completes, the Analyze page will use the trained model for predictions</li>
            <li>• Training runs as a background job and may take several minutes for large datasets</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
