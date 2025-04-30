import { useState } from "react";
import { GoogleGenAI } from "@google/genai";

// Gemini API Key
// AIzaSyApQcY06qqFCjj6yzJwgogJP9RV46PA158


export default function Generate() {
  const [topic, setTopic] = useState("History");
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

      //  Send to Gemini API
      
      const ai = new GoogleGenAI({ apiKey: "AIzaSyApQcY06qqFCjj6yzJwgogJP9RV46PA158" });

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Generate me questions about ${topic}`,
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
<>
        <div>
          <label htmlFor="topic" className="block text-lg font-medium text-gray-700 mb-2">
            Topic
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. World War II"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
  
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
  
        {questions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">Quiz Questions</h2>
            <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-gray-50">
              {questions.map((q, i) => (
                <div
                  key={i}
                  className="px-4 py-3 text-base text-gray-900 hover:bg-white transition duration-150"
                >
                  <span className="font-medium mr-2">{i + 1}.</span> {q}
                </div>
              ))}
            </div>
          </div>
        )}
    </>
  );
}  