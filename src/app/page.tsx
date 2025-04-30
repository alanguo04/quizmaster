"use client";

import { useState } from "react";
import { storage } from "../lib/firebase/firebase";
import { listAll, ref, getDownloadURL } from "firebase/storage";



import { GoogleGenAI } from "@google/genai";

// Gemini API Key
// AIzaSyApQcY06qqFCjj6yzJwgogJP9RV46PA158


export default function Home() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // 🔍 Get latest .txt file

      /*
      const folderRef = ref(storage, "uploads/");
      const files = await listAll(folderRef);
      const txtFiles = files.items.filter(item => item.name.endsWith(".txt"));
      const latest = txtFiles.sort((a, b) => b.name.localeCompare(a.name))[0]; // assumes naming has timestamps or lexicographically latest = latest

      const url = await getDownloadURL(latest);
      const txtContent = await fetch(url).then(res => res.text());

      */

      const txtContent = "History";
      // 🤖 Send to Gemini API
      const ai = new GoogleGenAI({ apiKey: "AIzaSyApQcY06qqFCjj6yzJwgogJP9RV46PA158" });

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Generate me questions about ${txtContent}`,
      });
      const text = response.text;
      const questions = text.split("\n")
  .map((line) => line.replace(/^\d+\.?\s*/, "").trim())
  .filter((line) => line.length > 0);
      setQuestions(questions || []);
  } catch (err) {
    console.error("Failed to generate questions:", err);
  } finally {
    setLoading(false);
  }};

  return (
    <div className="p-8 space-y-6">
      <button
        onClick={handleGenerate}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Generating..." : "Generate"}
      </button>

      <div>
        <h2 className="text-xl font-semibold">Generated Questions:</h2>
        <ul className="list-disc pl-6">
          {questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
