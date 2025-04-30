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
        <div>
          <input type="file" onChange={handleFileChange} className="mb-2" />
          <button onClick={handleUpload}>
            Upload
          </button>
        </div>
      );
    
}

export default FileUploader;

