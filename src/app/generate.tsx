import { useState } from "react";
import { GoogleGenAI } from "@google/genai";

// Gemini API Key
// AIzaSyApQcY06qqFCjj6yzJwgogJP9RV46PA158


export default function Generate() {
  const [topic, setTopic] = useState("History");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [numMC, setNumMC] = useState(3);
  const [numTF, setNumTF] = useState(1);
  const [numFR, setNumFR] = useState(1);

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

      // 🤖 Send to Gemini API
      const ai = new GoogleGenAI({ apiKey: "AIzaSyApQcY06qqFCjj6yzJwgogJP9RV46PA158" });

      const typePromptParts = [];
      if (numMC > 0) typePromptParts.push(`${numMC} multiple choice`);
      if (numTF > 0) typePromptParts.push(`${numTF} true/false`);
      if (numFR > 0) typePromptParts.push(`${numFR} free response`);

      const formatText = typePromptParts.join(", ");
      const prompt = `Generate ${formatText} quiz questions about ${topic}. Each question should start with a number.

- For multiple choice, include 4 options labeled A. to D., and state the correct answer at the end as: "Answer: A"
- For true/false, end with: "Answer: True" or "Answer: False"
- For free response, use "Answer: [Example]" followed by a brief sample answer.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      const text = response.text;
      const rawLines = text.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);

      const qLines: string[] = [];
      const aLines: string[] = [];

      rawLines.forEach((line) => {
        if (/^answer:/i.test(line)) {
          aLines.push(line);
        } else {
          qLines.push(line.replace(/^\*\*\d{3,4}:?\*\*\s*/, ""));
        }
      });

      setQuestions(qLines);
      setAnswers(aLines);
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

        <div className="mb-4">
        <label className="block text-lg font-medium text-gray-700 mb-2">Question Types</label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Multiple Choice</label>
            <input
              type="number"
              min="0"
              value={numMC}
              onChange={(e) => setNumMC(parseInt(e.target.value))}
              className="w-full border rounded-lg px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">True / False</label>
            <input
              type="number"
              min="0"
              value={numTF}
              onChange={(e) => setNumTF(parseInt(e.target.value))}
              className="w-full border rounded-lg px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Free Response</label>
            <input
              type="number"
              min="0"
              value={numFR}
              onChange={(e) => setNumFR(parseInt(e.target.value))}
              className="w-full border rounded-lg px-2 py-1"
            />
          </div>
        </div>
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
                  {q}
                </div>
              ))}
            </div>
          </div>
        )}

        {answers.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800">Answers</h2>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            {answers.map((ans, i) => (
              <li key={i} className="text-gray-700">{ans}</li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}  
