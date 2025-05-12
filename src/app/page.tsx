"use client";

#import FileUploader from "./fileuploader";
#import Generate from "./generate";
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
      <h1 className="text-2xl font-bold mb-4">Welcome</h1>
        #<FileUploader />
        #<Generate />
    </div>
  );
}  
