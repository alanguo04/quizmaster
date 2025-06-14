import { useState, useEffect } from "react";
import { GoogleGenAI,createUserContent,
  createPartFromUri, } from "@google/genai";
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase/firebase";
import FileDropdown from "./components/fileselect";

// Gemini API Key
// AIzaSyApQcY06qqFCjj6yzJwgogJP9RV46PA158

interface QuizQuestion {
  type: 'multiple-choice' | 'true-false' | 'free-response';
  question: string;
  options?: string[];
  answer: string;
  score: number;
}

interface UserAnswer {
  questionIndex: number;
  answer: string;
}

interface SavedQuiz {
  id: string;
  topic: string;
  questions: QuizQuestion[];
  userAnswers: UserAnswer[];
  score: number;
  timestamp: Timestamp;
  date: string;
}

export default function Generate() {
  const [topic, setTopic] = useState("History");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizMode, setQuizMode] = useState(true);
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<SavedQuiz | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [score, setScore] = useState(0);

  const [Reason, setReason] = useState("");

  // data for file
  const [selectedFileUrl, setSelectedFileUrl] = useState("");
  const [fileContent, setFileContent] = useState("");

  const [numMC, setNumMC] = useState(3);
  const [numTF, setNumTF] = useState(1);
  const [numFR, setNumFR] = useState(1);

  const [firstGeneration, setFirstGeneration] = useState(true);

  const [showReason, setShowReason] = useState(false);

  useEffect(() => {
    fetchSavedQuizzes();
  }, []);

// THIS IS FOR SETTING URL INTO CONTENT

  useEffect(() => {
  const fetchFileContent = async () => {
    if (!selectedFileUrl) return;

    try {
      // const res = await fetch(selectedFileUrl);
      // const text = await res.text();
      // setFileContent(text);
      setFileContent(selectedFileUrl)
      setFirstGeneration(true);
      
    } catch (err) {
      console.error("Failed to fetch file content:", err);
    }

    // attempt 2 --------------
    // if (!selectedFileUrl) return;

    // try {
    //   const response = await fetch(selectedFileUrl);
    //   if (!response.ok) {
    //     throw new Error(`HTTP error! status: ${response.status}`);
    //   }
    //   const text = await response.text();
    //   setFileContent(text);
    // } catch (error) {
    //   console.error("Failed to fetch file content:", error);
    // }
  };

  fetchFileContent();
}, [selectedFileUrl]);

  const fetchSavedQuizzes = async () => {
    setIsLoadingHistory(true);
    try {
      const quizzesRef = collection(db, "quizzes");
      
      const quizQuery = query(quizzesRef, orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(quizQuery);
      
      const quizzes: SavedQuiz[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        quizzes.push({
          id: doc.id,
          topic: data.topic,
          questions: data.questions,
          userAnswers: data.userAnswers,
          score: data.score,
          timestamp: data.timestamp,
          date: new Date(data.timestamp.toDate()).toLocaleDateString()
        });
      });
      
      setSavedQuizzes(quizzes);
    } catch (error) {
      console.error("Error fetching saved quizzes:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleGenerate = async () => {
    setScore(0);
    setLoading(true);
    setShowResults(false);
    setUserAnswers([]);
    setQuizMode(true);
    setSelectedQuiz(null);
    setShowHistory(false);
    


    
    try {
      const ai = new GoogleGenAI({ apiKey: "AIzaSyApQcY06qqFCjj6yzJwgogJP9RV46PA158" });
      const responsee = await fetch(selectedFileUrl);
      if (!responsee.ok) throw new Error("Failed to fetch file from Firebase");

      const fileBlob = await responsee.blob();

    // 2. Upload to Gemini
    const uploadedFile = await ai.files.upload({
      file: fileBlob,
      config: {mimeType:"application/pdf"},
    });
      if (firstGeneration) {
      

      const typeSuggestionPrompt = `
      Based on the content of the uploaded file, suggest how many multiple choice, true/false, and free response questions should be generated for a balanced quiz. 
      Give a reasoning for why you selected it as well and explain without first person. 
      
      Must have at least 1 of each type.
      Return your answer in the following format:

      Multiple Choice: [number]
      True/False: [number]
      Free Response: [number]
      Reasoning: [explanation]
    `;
    

      

      const responseformat = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: createUserContent([
          createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),
          typeSuggestionPrompt,
        ]),
      });
        const typeText = responseformat.text;
        const mcMatch = typeText.match(/Multiple Choice:\s*(\d+)/i);
        const tfMatch = typeText.match(/True\/False:\s*(\d+)/i);
        const frMatch = typeText.match(/Free Response:\s*(\d+)/i);
        const reasonMatch = typeText.match(/Reasoning:\s*(.*)/i);
      
        const numMCParsed = mcMatch ? parseInt(mcMatch[1]) : 0;
        const numTFParsed = tfMatch ? parseInt(tfMatch[1]) : 0;
        const numFRParsed = frMatch ? parseInt(frMatch[1]) : 0;
    
        setNumMC(numMCParsed);
        setNumTF(numTFParsed);
        setNumFR(numFRParsed);
        setReason(reasonMatch ? reasonMatch[1] : "");
        console.log(numMCParsed, numTFParsed, numFRParsed);

        var typePromptParts = [];
        // some reason numMC aren't changed yet when these happen, but works when I display in HTML
      if (numMC > 0) typePromptParts.push(`${numMCParsed} multiple choice`);
      if (numTF > 0) typePromptParts.push(`${numTFParsed} true/false`);
      if (numFR > 0) typePromptParts.push(`${numFRParsed} free response`);
    } else {
      var typePromptParts = [];
      if (numMC > 0) typePromptParts.push(`${numMC} multiple choice`);
      if (numTF > 0) typePromptParts.push(`${numTF} true/false`);
      if (numFR > 0) typePromptParts.push(`${numFR} free response`);
    }

      const formatText = typePromptParts.join(", ");
      
      // this is prompt for just a singular word history
      // const prompt = `Generate ${formatText} quiz questions about ${topic}. Format each question as follows:
      console.log(formatText);
      // this is prompt for about the file
      const prompt = `Generate ${formatText} quiz questions based on uploaded file \n\nWrite each question according to the following instructions:

      For multiple choice questions, use this format:
      Q: [Question]
      A. [Option 1]
      B. [Option 2]
      C. [Option 3]
      D. [Option 4]
      Answer: [Letter]

      For true/false questions, use this format:
      Q: [Question]
      Answer: True/False

      Both multiple choice questions and true/false questions should meet these criteria.
      1. The question shouldn't be unnecessarily wordy or complicated. That means the question avoids using items like 'None of the above' or 'All of the above' to the extent possible. Only use negatives in the question stem when significant learning outcomes require it. Avoid fill in the blank questions.
      2. Each multiple choice question should cover a different topic. 
      3. In multiple choice questions, every possible answer should be plausible.

      For free response questions, use this format:
      Q: [Question]
      Answer: [Example answer]

      Free response questions should try and meet these criteria:
      1. They require quiz takers to compose an answer instead of select an answer.
      2. They require the student to write more than one sentence.
      3. They allow different or original responses or patterns of responses.
      4. They require subjective judgement to judge accuracy and quality of the responses. 

      Number each question starting from 1.`;

      // debugging sample prompt
      //const prompt = `return this ${selectedFileUrl}`

      

    const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: createUserContent([
      createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),
      prompt,
    ]),
  });
      // const response = await ai.models.generateContent({
      //   model: "gemini-2.0-flash", 
      //   contents: prompt,
      // });

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
    setFirstGeneration(false);
    setReason("Quiz Questions have adapted based on your results");
  };
  

  const checkAnswers = async () => {
    setScore(await calculateScore());
    setShowResults(true);
    adjustQuestionMix();
  };

  // const calculateScore = () => {
  //   let correct = 0;
  //   questions.forEach((question, index) => {
  //     const userAnswer = getUserAnswer(index);
  //     if (userAnswer === question.answer) {
  //       correct++;
  //     }
  //   });
  //   return correct;
  // };

  // add async if API

  // NOTE FOR ALAN, Maybe make this function into check answers and just use react state to save score.
  const calculateScore = async () => {
  let correct = 0;

  const ai2 = new GoogleGenAI({ apiKey: "AIzaSyApQcY06qqFCjj6yzJwgogJP9RV46PA158" });

  for (let index = 0; index < questions.length; index++) {
    const question = questions[index];
    const userAnswer = getUserAnswer(index);

    if (question.type === 'free-response') {
      if (!userAnswer) continue;

      const prompt = `Based on this question:\n${question.question}\n\nGrade on a numerical scale from 0-1 how much this
       response:\n"${userAnswer}"\n\nmatches this ideal answer:\n"${question.answer}". It doesn't have to be perfect, but it should be close.
       A response that gets the general idea is around 0.7-1, a response that has some ideas right but missing stuff or is wrong for some is 0.3-0.6,
       and a completely wrong answer is a 0-0.2.
       \n\nOnly return the number.
       `;

      console.log(prompt);

      const debug = 'return 0.69'
      try {
        const response = await ai2.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
        });

        const text = response.text;
        console.log(text);
        const score2 = parseFloat(text.match(/[\d.]+/)?.[0] || "0");

        correct += score2;  // You can adjust this threshold
        question.score = score2;
        console.log(score2)
      } catch (err) {
        console.error("Free response grading failed:", err);
      }
    } else {
      if (userAnswer === question.answer) {
        correct++;
        question.score = 1;
      } else {
        question.score = 0;
      }
    }
  }

  return correct;
};

  const viewQuizHistory = () => {
    setShowHistory(true);
    setSelectedQuiz(null);
    fetchSavedQuizzes();
  };

  const selectQuiz = (quiz: SavedQuiz) => {
    setSelectedQuiz(quiz);
    setShowHistory(false);
    setQuestions(quiz.questions);
    setUserAnswers(quiz.userAnswers);
    setShowResults(true);
    setQuizMode(false);
    setTopic(quiz.topic);
    
    setTimeout(() => {
      displayPDFForQuiz(quiz);
    }, 100);
  };
  
  const displayPDFForQuiz = (quiz: SavedQuiz) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Popup blocker may be preventing the PDF from opening. Please allow popups for this site.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${quiz.topic} Quiz Results</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px; 
              line-height: 1.6;
            }
            h1 { color: #333; text-align: center; }
            .score { 
              background-color: #e8f7e8; 
              padding: 15px; 
              border-radius: 8px; 
              text-align: center; 
              font-size: 18px; 
              font-weight: bold;
              margin-bottom: 30px;
            }
            .question { 
              margin-bottom: 25px; 
              padding: 15px; 
              border: 1px solid #ddd; 
              border-radius: 8px;
            }
            .question-number { 
              font-weight: bold; 
              color: #2563eb;
              font-size: 16px;
            }
            .question-text { 
              font-size: 16px; 
              margin: 10px 0;
            }
            .answer-line { 
              margin: 5px 0; 
              padding-left: 20px;
            }
            .correct { color: #059669; }
            .incorrect { color: #dc2626; }
            .status { font-weight: bold; }
            @media print {
              body { padding: 0; }
              .question { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>${quiz.topic} Quiz Results</h1>
          <div class="score">
            Your Score: ${quiz.score} out of ${quiz.questions.length}
          </div>
          ${quiz.questions.map((question, index) => {
            const userAnswer = quiz.userAnswers.find(a => a.questionIndex === index)?.answer;
            let isCorrect;

            if (question.type === 'free-response') {
              isCorrect = question.score > 0.5;
            } else {
              isCorrect = userAnswer === question.answer;
            }
            return `
              <div class="question">
                <div class="question-number">Question ${index + 1}</div>
                <div class="question-text">${question.question}</div>
                <div class="answer-line">Your Answer: <strong>${userAnswer || 'Not answered'}</strong></div>
                <div class="answer-line">Correct Answer: <strong class="correct">${question.answer}</strong></div>
                <div class="answer-line status ${isCorrect ? 'correct' : 'incorrect'}">
                  ${isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </div>
              </div>
            `;
          }).join('')}
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
  };

  const returnToCurrentQuiz = () => {
    setShowHistory(false);
    setSelectedQuiz(null);
  };

  const exportToPDF = async () => {
    if (userAnswers.length === 0) {
      alert("Please answer at least one question before exporting to PDF.");
      return;
    }
    
    setIsSaving(true);
    try {
      const quizData = {
        topic,
        questions,
        userAnswers,
        score: score,
        timestamp: Timestamp.now()
      };
      
      await addDoc(collection(db, "quizzes"), quizData);
      console.log("Quiz saved to history before PDF export");
      
      await fetchSavedQuizzes();
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert("Popup blocker may be preventing the PDF from opening. Please allow popups for this site.");
        setIsSaving(false);
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${topic} Quiz Results</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 20px; 
                line-height: 1.6;
              }
              h1 { color: #333; text-align: center; }
              .score { 
                background-color: #e8f7e8; 
                padding: 15px; 
                border-radius: 8px; 
                text-align: center; 
                font-size: 18px; 
                font-weight: bold;
                margin-bottom: 30px;
              }
              .question { 
                margin-bottom: 25px; 
                padding: 15px; 
                border: 1px solid #ddd; 
                border-radius: 8px;
              }
              .question-number { 
                font-weight: bold; 
                color: #2563eb;
                font-size: 16px;
              }
              .question-text { 
                font-size: 16px; 
                margin: 10px 0;
              }
              .answer-line { 
                margin: 5px 0; 
                padding-left: 20px;
              }
              .correct { color: #059669; }
              .incorrect { color: #dc2626; }
              .status { font-weight: bold; }
              @media print {
                body { padding: 0; }
                .question { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <h1>${topic} Quiz Results</h1>
            <div class="score">
              Your Score: ${score} out of ${questions.length}
            </div>
            ${questions.map((question, index) => {
              const userAnswer = getUserAnswer(index);
              const isCorrect = userAnswer === question.answer;
              return `
                <div class="question">
                  <div class="question-number">Question ${index + 1}</div>
                  <div class="question-text">${question.question}</div>
                  <div class="answer-line">Your Answer: <strong>${userAnswer || 'Not answered'}</strong></div>
                  <div class="answer-line">Correct Answer: <strong class="correct">${question.answer}</strong></div>
                  <div class="answer-line status ${isCorrect ? 'correct' : 'incorrect'}">
                    ${isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </div>
                </div>
              `;
            }).join('')}
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      
      alert("Quiz has been saved to history and exported as PDF");
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("Failed to save quiz and generate PDF. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleQuizMode = () => {
    setQuizMode(!quizMode);
    setShowResults(false);
    setUserAnswers([]);
  };

  const handleChooseTypes = () => {
    // You can replace this logic with actual AI-generated values
    const aiChosen = {
      mc: 3,
      tf: 2,
      fr: 1,
      reason: "These numbers were chosen to balance conceptual understanding (FR), factual recall (TF), and application (MC)."
    };

    // setNumMC(aiChosen.mc);
    // setNumTF(aiChosen.tf);
    // setNumFR(aiChosen.fr);

    setNumMC(1);
    setNumTF(1);
    setNumFR(1);
    setReason("Testing!");
  };

  return (
    <div className="container mx-auto p-4">
      {!showHistory ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Quiz Generator</h1>
            <button
              onClick={viewQuizHistory}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              View Saved PDFs
            </button>
          </div>

          
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
            {
              // for selecting file
            }
            <FileDropdown
              selectedFileUrl={selectedFileUrl}
              setSelectedFileUrl={setSelectedFileUrl}
            />

            {/* <img
  src={selectedFileUrl}
  alt="Uploaded Image"
  className="max-w-full h-auto rounded-lg shadow"
/> */}
            {/* <div>
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
                disabled={selectedQuiz !== null}
              />
            </div> */}

            {/* This is all letting the user choose how many questions of each type they want. */}

            {/* <div className="mb-4 mt-4">
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
                    disabled={selectedQuiz !== null}
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
                    disabled={selectedQuiz !== null}
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
                    disabled={selectedQuiz !== null}
                  />
                </div>
              </div>
            </div> */}

            {/* This is us doing it */}

            {/* <button
        onClick={handleChooseTypes}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        disabled={selectedQuiz !== null}
      >
        Let AI Choose Question Types
      </button>
      {Reason && (
        <p className="mt-3 text-sm text-gray-600 italic">
          {numMC} multiple choice, {numTF} true/false, {numFR} free response
          {Reason}
        </p>
      )} */}

            <button
              onClick={handleGenerate}
              disabled={loading || selectedQuiz !== null}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 mt-4"
            >
              {loading ? "Generating..." : "Generate New Quiz"}
            </button>
          </div>

          {selectedQuiz && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-blue-800">Viewing Saved Quiz</h2>
                  <p className="text-sm text-blue-600">
                    {selectedQuiz.topic} - Completed on {selectedQuiz.date}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => displayPDFForQuiz(selectedQuiz)}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 rounded-lg transition duration-200 text-sm flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Open PDF
                  </button>
                  <button
                    onClick={returnToCurrentQuiz}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-lg transition duration-200 text-sm"
                  >
                    Return to Quiz Creator
                  </button>
                </div>
              </div>
            </div>
          )}

          {questions.length > 0 && !selectedQuiz && (
            <div className="space-y-6">
              {/* This is the reasoning for the question types */}
              {Reason && (
  <div className="text-center mb-6">
  <button
    onClick={() => setShowReason(!showReason)}
    className="text-sm border border-gray-400 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition"
  >
    {showReason ? "Hide Reasoning" : "Show Quiz Construction Reasoning"}
  </button>

  {showReason && (
    <div className="mt-4 mx-auto max-w-3xl bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 italic whitespace-pre-wrap text-left">
      {Reason}
    </div>
  )}
</div>

)}
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
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-lg font-semibold text-green-800">
                      Your Score: {score} out of {questions.length}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Next quiz will focus more on your weak areas based on this result.
                    </p>
                  </div>
                  <button
                    onClick={exportToPDF}
                    disabled={isSaving}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 flex justify-center items-center"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving & Exporting...
                      </>
                    ) : (
                      "Save Quiz & Export as PDF"
                    )}
                  </button>
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
                          
                          {(!quizMode || showResults) && (
                            <div className="border-t border-gray-200 pt-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-500">
                                  Answer:
                                </span>
                                <span className="text-sm text-gray-900 font-medium">
                                  {question.answer}
                                </span>
                                
                              </div>
                              {showResults && (
                                  <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-500">
                                      Score:
                                    </span>
                                    <span className="text-sm text-gray-900 font-medium">
                                      {question.score} out of 1
                                    </span>
                                  </div>
                                )}
                              
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedQuiz && (
            <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Quiz PDF Ready to View</h3>
              <p className="text-gray-600 mb-6">Click the button below to open the PDF view of this quiz.</p>
              <button
                onClick={() => displayPDFForQuiz(selectedQuiz)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Open PDF View
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Saved Quiz PDFs</h1>
            <button
              onClick={returnToCurrentQuiz}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              Return to Quiz Creator
            </button>
          </div>

          {isLoadingHistory ? (
            <div className="flex justify-center items-center p-12">
              <div className="text-center">
                <svg className="animate-spin h-10 w-10 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-lg text-gray-600">Loading your saved PDFs...</p>
              </div>
            </div>
          ) : savedQuizzes.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-lg text-gray-600">You haven't saved any quiz PDFs yet.</p>
              <button
                onClick={returnToCurrentQuiz}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                Create Your First Quiz
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4 cursor-pointer"
                  onClick={() => selectQuiz(quiz)}
                >
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{quiz.topic}</h3>
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                    <span>{quiz.date}</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {quiz.questions.length} Questions
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-500">
                      Score: {quiz.score} / {quiz.questions.length}
                    </div>
                    <div className="bg-green-50 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                      {Math.round((quiz.score / quiz.questions.length) * 100)}%
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <button className="text-blue-600 text-sm hover:underline flex items-center justify-center mx-auto">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
