"use client";

import Image from "next/image";

import { useState } from "react";
import { storage } from "../lib/firebase/firebase";
import { listAll, ref, getDownloadURL } from "firebase/storage";

import { GoogleGenAI } from "@google/genai";

// Gemini API Key
// AIzaSyApQcY06qqFCjj6yzJwgogJP9RV46PA158


export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-extrabold mb-6 text-center text-blue-600">
        QuizIt!: Your Study Companion
      </h1>
      <p className="text-lg text-gray-700 mb-8 text-center">
        Generate personalized quizzes to help you study effectively and ace your exams!
      </p>
      <div className="flex justify-center">
        <button className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-600 transition duration-300">
          Get Started
        </button>
      </div>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition duration-300">
          <h2 className="text-xl font-semibold mb-2 text-blue-500">Upload Material</h2>
          <p className="text-gray-600">
        Upload your study materials to create personalized quizzes effortlessly.
          </p>
        </div>
        <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition duration-300">
          <h2 className="text-xl font-semibold mb-2 text-blue-500">Customize Quizzes</h2>
          <p className="text-gray-600">
        Tailor quizzes to your specific needs and focus on key topics.
          </p>
        </div>
        <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition duration-300">
          <h2 className="text-xl font-semibold mb-2 text-blue-500">Track Progress</h2>
          <p className="text-gray-600">
        Keep track of your progress and identify areas for improvement.
          </p>
        </div>
      </div>
    </div>
  );
}  
