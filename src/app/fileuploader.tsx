"use client";

import React, { ChangeEvent, useState } from 'react';
import { uploadFile } from '../lib/firebase/firebase.js';

const FileUploader = () => {
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0] || null;
        setFile(selectedFile);
    };

    const handleUpload = async () => {
        if (file === null) return; 

        try {
            const url = await uploadFile(file);
            console.log('File uploaded successfully:', url);
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };

    return (
        <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-8 space-y-6">
          <input type="file" onChange={handleFileChange} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50" />
          <button onClick={handleUpload} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50">
            Upload
          </button>
        </div>
      );
    
}

export default FileUploader;

