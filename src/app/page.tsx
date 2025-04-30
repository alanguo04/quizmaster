"use client";

import FileUploader from "./fileuploader";
import Generate from "./generate";
import Image from "next/image";

import { useState } from "react";
import { storage } from "../lib/firebase/firebase";
import { listAll, ref, getDownloadURL } from "firebase/storage";

import { GoogleGenAI } from "@google/genai";

// Gemini API Key
// AIzaSyApQcY06qqFCjj6yzJwgogJP9RV46PA158


export default function Home() {

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-8 space-y-6">
        <FileUploader />
        <Generate />
      </div>
    </div>
  );
}  
