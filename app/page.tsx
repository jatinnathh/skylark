// app\page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  Crosshair,
  CheckCircle2,
  AlertCircle,
  X,
  Maximize2,
  FileImage,
  Map,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Notify on page visit
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "Page Visit", details: `A user visited the GCP Analysis Dashboard.\nBrowser/Device info: ${ua}` })
    }).catch(err => console.error("Notification failed", err));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  };

  const handleRunPrediction = async () => {
    if (!file) return;
    setIsUploading(true);

    // Notify prediction started
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "Prediction Requested", details: `User requested prediction for file: ${file.name}\nBrowser/Device info: ${ua}` })
    }).catch(err => console.error("Notification failed", err));

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Directly call the Hugging Face Space to avoid Vercel's 10s Serverless timeout
      // especially when the HF Space is cold-starting (takes 2-3 minutes).
      const apiUrl = process.env.NEXT_PUBLIC_API_URL as string;
      const res = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to predict");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Error running prediction. Ensure the Hugging Face Space is active.");
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSampleImageClick = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const sampleFile = new File([blob], filename, { type: blob.type || "image/jpeg" });
      setFile(sampleFile);
      setPreviewUrl(url);
      setResult(null);
    } catch (err) {
      console.error("Failed to load sample image", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-zinc-100 font-sans selection:bg-zinc-800">

      <main className="max-w-6xl mx-auto px-6 py-14">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1a1a] border border-zinc-800 text-xs text-zinc-400 font-medium mb-5">
            <Crosshair className="w-3.5 h-3.5" />
            <span>Skylark Pose Engine v2.0</span>
          </div>
          <h1 className="text-5xl font-semibold tracking-tight text-white mb-4">
            GCP Analysis Dashboard
          </h1>
          <p className="text-zinc-500 max-w-xl mx-auto text-base leading-relaxed">
            Upload high-resolution aerial imagery to detect and geolocate Ground Control Points
            using a CNN-style sliding window architecture.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left column */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-5 flex flex-col gap-5"
          >

            {/* Upload card */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-zinc-800/80 overflow-hidden">
              <div className="px-5 pt-5 pb-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">
                  Input image
                </p>

                <AnimatePresence mode="wait">
                  {!file ? (
                    <motion.div
                      key="dropzone"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-zinc-700/50 rounded-xl cursor-pointer hover:bg-zinc-800/50 hover:border-zinc-600 transition-colors duration-200"
                    >
                      <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-4">
                        <UploadCloud className="w-6 h-6 text-zinc-400" />
                      </div>
                      <p className="text-sm font-medium text-white mb-1">Drop aerial image here</p>
                      <p className="text-xs text-zinc-400">JPEG or PNG · click to browse</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="file-info"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-between bg-[#242424] border border-zinc-700/50 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-zinc-700/50 flex items-center justify-center shrink-0">
                          <FileImage className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium text-zinc-200 truncate">{file.name}</p>
                          <p className="text-xs text-zinc-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); reset(); }}
                        className="p-1.5 rounded-lg hover:bg-zinc-200 transition-colors"
                      >
                        <X className="w-4 h-4 text-zinc-400 hover:text-zinc-600" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/jpeg,image/png,image/jpg"
                />
              </div>

              {/* Run button */}
              <AnimatePresence>
                {file && !result && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-zinc-800/80 px-5 py-4"
                  >
                    <button
                      onClick={handleRunPrediction}
                      disabled={isUploading}
                      className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Analyzing image…</span>
                        </>
                      ) : (
                        <>
                          <Crosshair className="w-4 h-4" />
                          <span>Run GCP detection</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sample Images Section */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-zinc-800/80 overflow-hidden px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">
                Or use sample images
              </p>
              <div className="grid grid-cols-5 gap-2">
                {[
                  "DJI_0109.JPG",
                  "DJI_20231129125339_0216.JPG",
                  "DJI_20231129125400_0226.JPG",
                  "DJI_20231129140509_0368.JPG",
                  "DJI_20231129140515_0371.JPG",
                  "DJI_20241205102639_0091_V.JPG"
                ].map((filename, i) => (
                  <button
                    key={i}
                    onClick={() => handleSampleImageClick(`/sampleimages/${filename}`, filename)}
                    className="relative aspect-square rounded-lg overflow-hidden border border-zinc-700/50 hover:border-zinc-500 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 group"
                  >
                    <img
                      src={`/sampleimages/${filename}`}
                      alt={`Sample ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Results card */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="bg-[#1a1a1a] rounded-2xl border border-zinc-800/80 overflow-hidden"
                >
                  {/* Result header */}
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800/80">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        result.status === "DET" ? "bg-emerald-500" : "bg-red-400"
                      }`}
                    />
                    <span className="text-sm font-medium text-zinc-200">
                      {result.status === "DET" ? "Target acquired" : "No target detected"}
                    </span>
                  </div>

                  {result.status === "DET" ? (
                    <>
                      {/* X / Y coords */}
                      <div className="grid grid-cols-2 divide-x divide-zinc-800/80 border-b border-zinc-800/80">
                        <div className="px-5 py-4">
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">
                            X coordinate
                          </p>
                          <p className="text-2xl font-medium font-mono text-white">
                            {result.x.toFixed(1)}
                          </p>
                        </div>
                        <div className="px-5 py-4">
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">
                            Y coordinate
                          </p>
                          <p className="text-2xl font-medium font-mono text-white">
                            {result.y.toFixed(1)}
                          </p>
                        </div>
                      </div>

                      {/* Class + confidence */}
                      <div className="flex items-center justify-between px-5 py-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">
                            Classification
                          </p>
                          <p className="text-sm font-medium text-zinc-200">{result.class}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">
                            Confidence
                          </p>
                          <p className="text-sm font-medium font-mono text-emerald-600">
                            {(result.confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="px-5 py-4 text-sm text-zinc-500 leading-relaxed">
                      The model did not detect a Ground Control Point in the uploaded image.
                      Try a higher-resolution crop or a different region.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>

          {/* Right column: viewport */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-7 bg-[#1a1a1a] border border-zinc-800/80 rounded-2xl overflow-hidden flex flex-col min-h-[500px]"
          >
            {/* Title bar */}
            <div className="h-11 border-b border-zinc-800/80 bg-[#1a1a1a] flex items-center px-4 justify-between shrink-0">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-xs text-zinc-500 font-mono">
                {result ? "output_preview.jpg" : file ? file.name : "viewport"}
              </span>
              <Maximize2 className="w-3.5 h-3.5 text-zinc-500" />
            </div>

            {/* Canvas */}
            <div className="flex-1 relative bg-[#141414] flex items-center justify-center p-6 overflow-hidden">
              {/* Subtle dot grid */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: "radial-gradient(circle, #52525b 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />

              {!previewUrl ? (
                <div className="text-center text-zinc-400 flex flex-col items-center z-10">
                  <Map className="w-12 h-12 opacity-25 mb-3" />
                  <p className="text-sm">Awaiting satellite imagery</p>
                </div>
              ) : (
                <motion.img
                  key={result?.image_b64 ?? previewUrl}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={
                    result?.image_b64
                      ? `data:image/jpeg;base64,${result.image_b64}`
                      : previewUrl
                  }
                  alt="Preview"
                  className="max-w-full max-h-full object-contain rounded-xl ring-1 ring-zinc-200 z-10 relative"
                />
              )}

              {/* Scanning overlay */}
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center flex-col z-20">
                  <div className="relative w-48 h-48 border border-zinc-700 rounded-xl overflow-hidden mb-5 bg-black">
                    <motion.div
                      animate={{ y: ["0%", "2400%", "0%"] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                      className="absolute top-0 left-0 w-full h-0.5 bg-emerald-500 z-10"
                    />
                    <img
                      src={previewUrl!}
                      className="w-full h-full object-cover opacity-30 grayscale"
                    />
                  </div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 font-mono">
                    Processing (May take some time as it is hosted on HUggingface) 
                  </p>
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}