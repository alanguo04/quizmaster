import React from 'react';
import FileUploader from "../fileuploader";

export default function Upload() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Upload Your Quiz</h1>
      <FileUploader />
    </div>
  );
};