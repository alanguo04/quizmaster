"use client";

import React, { ChangeEvent, useState } from 'react';
import { uploadFile } from '../lib/firebase/firebase.js';
import { useRouter } from 'next/navigation';

const FileUploader = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0] || null;
        setFile(selectedFile);
        setUploadSuccess(false); // Reset success state when new file is selected
    };

    const handleUpload = async () => {
        if (file === null) return;

        setIsUploading(true);
        setUploadSuccess(false);

        try {
            const url = await uploadFile(file);
            console.log('File uploaded successfully:', url);
            setUploadSuccess(true);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };


    return (
        <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-8 space-y-6">
            <input 
                type="file" 
                onChange={handleFileChange} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
                disabled={isUploading}
            />
            <button 
                onClick={handleUpload} 
                disabled={!file || isUploading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 relative"
            >
                {isUploading ? (
                    <>
                        <span className="inline-flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                        </span>
                    </>
                ) : (
                    "Upload"
                )}
            </button>
            {uploadSuccess && (
                <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                        <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-700">File uploaded successfully!</span>
                    </div>
                    <a href="/practice">
                    <button 
                        className="w-full border border-blue-200 hover:bg-blue-50 text-blue-700 font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center"
                    >
                        <span>Go to Practice</span>
                    </button>
                    </a>
                </div>
            )}
        </div>
    );
}

export default FileUploader;

