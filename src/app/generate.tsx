import { useState } from "react";
import { GoogleGenAI } from "@google/genai";
import jsPDF from "jspdf"

// Gemini API Key
// AIzaSyApQcY06qqFCjj6yzJwgogJP9RV46PA158

interface QuizQuestion {
  type: 'multiple-choice' | 'true-false' | 'free-response';
  question: string;
  options?: string[];
  answer: string;
}

interface UserAnswer {
  questionIndex: number;
  answer: string;
}

export default function Generate() {
  const [topic, setTopic] = useState("History");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizMode, setQuizMode] = useState(false);

  const [numMC, setNumMC] = useState(3);
  const [numTF, setNumTF] = useState(1);
  const [numFR, setNumFR] = useState(1);

  const handleGenerate = async () => {
    setLoading(true);
    setShowResults(false);
    setUserAnswers([]);
    setQuizMode(false);
    try {
      const ai = new GoogleGenAI({ apiKey: "AIzaSyApQcY06qqFCjj6yzJwgogJP9RV46PA158" });

      const typePromptParts = [];
      if (numMC > 0) typePromptParts.push(`${numMC} multiple choice`);
      if (numTF > 0) typePromptParts.push(`${numTF} true/false`);
      if (numFR > 0) typePromptParts.push(`${numFR} free response`);

      const formatText = typePromptParts.join(", ");
      const prompt = `Generate ${formatText} quiz questions about ${topic}. Format each question as follows:

      Multiple choice format:
      Q: [Question]
      A. [Option 1]
      B. [Option 2]
      C. [Option 3]
      D. [Option 4]
      Answer: [Letter]

      True/False format:
      Q: [Question]
      Answer: True/False

      Free response format:
      Q: [Question]
      Answer: [Example answer]

      Number each question starting from 1.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      const text = response.text;
      const questionBlocks = text.split(/\n(?=\d+\.)|(?=Q:)/);
      
      const parsedQuestions: QuizQuestion[] = questionBlocks
        .map(block => block.trim())
        .filter(block => block)
        .map(block => {
          const lines = block.split('\n').map(line => line.trim());
          let question = "";
          let options: string[] = [];
          let answer = "";
          let type: QuizQuestion['type'] = 'free-response';

          lines.forEach(line => {
            if (line.match(/^\d+\./) || line.startsWith('Q:')) {
              question = line.replace(/^\d+\.\s*/, '').replace('Q:', '').trim();
            } else if (line.match(/^[A-D]\./)) {
              options.push(line);
              type = 'multiple-choice';
            } else if (line.startsWith('Answer:')) {
              answer = line.replace('Answer:', '').trim();
              if (options.length === 0 && (answer === 'True' || answer === 'False')) {
                type = 'true-false';
              }
            }
          });

          return { type, question, options, answer };
        })
        .filter(q => q.question && q.answer);

      setQuestions(parsedQuestions);
    } catch (err) {
      console.error("Failed to generate questions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => {
      const newAnswers = prev.filter(a => a.questionIndex !== questionIndex);
      return [...newAnswers, { questionIndex, answer }];
    });
  };

  const getUserAnswer = (questionIndex: number) => {
    const userAnswer = userAnswers.find(a => a.questionIndex === questionIndex);
    return userAnswer?.answer;
  };

  const adjustQuestionMix = () => {
    const totalCount = numMC + numTF + numFR;
    const adaptiveCount = Math.round(totalCount * 0.8);
    const freeResponseCount = totalCount - adaptiveCount;
  
    const correct: Record<'multiple-choice' | 'true-false', number> = { 'multiple-choice': 0, 'true-false': 0 };
    const total: Record<'multiple-choice' | 'true-false', number> = { 'multiple-choice': 0, 'true-false': 0 };
  
    questions.forEach((q, i) => {
      if (q.type === 'multiple-choice' || q.type === 'true-false') {
        total[q.type]++;
        if (getUserAnswer(i) === q.answer) correct[q.type]++;
      }
    });
  
    const mcError = total['multiple-choice'] ? 1 - correct['multiple-choice'] / total['multiple-choice'] : 0;
    const tfError = total['true-false'] ? 1 - correct['true-false'] / total['true-false'] : 0;
    const errorSum = mcError + tfError;
  
    const mcRatio = errorSum === 0 ? 0.5 : mcError / errorSum;
    const tfRatio = errorSum === 0 ? 0.5 : tfError / errorSum;
  
    const newMC = Math.round(adaptiveCount * mcRatio);
    const newTF = adaptiveCount - newMC;
  
    setNumMC(newMC);
    setNumTF(newTF);
    setNumFR(freeResponseCount);
  };
  
  

  const checkAnswers = () => {
    setShowResults(true);
    adjustQuestionMix();
  };
  
  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      const userAnswer = getUserAnswer(index);
      if (userAnswer === question.answer) {
        correct++;
      }
    });
    return correct;
  };

  const toggleQuizMode = () => {
    setQuizMode(!quizMode);
    setShowResults(false);
    setUserAnswers([]);
  };

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
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">Quiz Questions</h2>
            <button
              onClick={toggleQuizMode}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              {quizMode ? "View Answers" : "Take Quiz"}
            </button>
          </div>

          {quizMode && !showResults && (
            <button
              onClick={checkAnswers}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              Check Answers
            </button>
          )}

          {showResults && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-lg font-semibold text-green-800">
                Your Score: {calculateScore()} out of {questions.length}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Next quiz will focus more on your weak areas based on this result.
              </p>

            </div>
          )}

          <div className="space-y-6">
            {questions.map((question, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">
                        {question.question}
                      </h3>
                      
                      {question.type === 'multiple-choice' && question.options && (
                        <div className="grid gap-2 mb-4">
                          {question.options.map((option, optionIndex) => {
                            const optionKey = option.charAt(0);
                            const userAnswer = getUserAnswer(index);
                            const isUserAnswer = userAnswer === optionKey;
                            const isCorrect = optionKey === question.answer;
                            const showCorrectAnswer = (!quizMode || showResults) && isCorrect;
                            const showIncorrectAnswer = showResults && isUserAnswer && !isCorrect;

                            return (
                              <button
                                key={optionIndex}
                                onClick={() => quizMode && !showResults && handleAnswer(index, optionKey)}
                                disabled={!quizMode || showResults}
                                className={`text-left p-3 rounded-lg border transition-colors ${
                                  showCorrectAnswer
                                    ? 'border-green-500 bg-green-50'
                                    : showIncorrectAnswer
                                    ? 'border-red-500 bg-red-50'
                                    : isUserAnswer && !showResults
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300 hover:border-gray-400'
                                } ${quizMode && !showResults ? 'cursor-pointer' : 'cursor-default'}`}
                              >
                                {option}
                                {isUserAnswer && !showResults && <span className="ml-2 text-blue-600">●</span>}
                                {showCorrectAnswer && (
                                  <span className="ml-2 text-green-600 font-medium">✓</span>
                                )}
                                {showIncorrectAnswer && (
                                  <span className="ml-2 text-red-600 font-medium">✗</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      
                      {question.type === 'true-false' && (
                        <div className="flex gap-4 mb-4">
                          {['True', 'False'].map((option) => {
                            const userAnswer = getUserAnswer(index);
                            const isUserAnswer = userAnswer === option;
                            const isCorrect = option === question.answer;
                            const showCorrectAnswer = (!quizMode || showResults) && isCorrect;
                            const showIncorrectAnswer = showResults && isUserAnswer && !isCorrect;

                            return (
                              <button
                                key={option}
                                onClick={() => quizMode && !showResults && handleAnswer(index, option)}
                                disabled={!quizMode || showResults}
                                className={`px-6 py-3 rounded-lg border transition-colors ${
                                  showCorrectAnswer
                                    ? 'border-green-500 bg-green-50'
                                    : showIncorrectAnswer
                                    ? 'border-red-500 bg-red-50'
                                    : isUserAnswer && !showResults
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300 hover:border-gray-400'
                                } ${quizMode && !showResults ? 'cursor-pointer' : 'cursor-default'}`}
                              >
                                {option}
                                {isUserAnswer && !showResults && <span className="ml-2 text-blue-600">●</span>}
                                {showCorrectAnswer && <span className="ml-2 text-green-600">✓</span>}
                                {showIncorrectAnswer && <span className="ml-2 text-red-600">✗</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {question.type === 'free-response' && quizMode && (
                        <textarea
                          value={getUserAnswer(index) || ''}
                          onChange={(e) => handleAnswer(index, e.target.value)}
                          placeholder="Type your answer here..."
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none mb-4"
                          rows={3}
                          disabled={showResults}
                        />
                      )}
                      
                      <div className="border-t border-gray-200 pt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">
                            {!quizMode || showResults ? 'Answer:' : 'Your answer:'}
                          </span>
                          <span className="text-sm text-gray-900 font-medium">
                            {!quizMode || showResults ? question.answer : (getUserAnswer(index) || 'Not answered')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>         
        </div>
      )}
    </>
  );
}
