"use client";

import React, { useEffect, useState } from 'react';
import { listFiles } from '../../lib/firebase/firebase.js'; // adjust path if needed

type FileInfo = {
  name: string;
  url: string;
};

const FileDropdown = ({
  selectedFileUrl,
  setSelectedFileUrl,
  disabled = false,
}: {
  selectedFileUrl: string;
  setSelectedFileUrl: (url: string) => void;
  disabled?: boolean;
}) => {
  const [files, setFiles] = useState<FileInfo[]>([]);

  useEffect(() => {
    const fetchFiles = async () => {
      const fetchedFiles = await listFiles();
      setFiles(fetchedFiles);
    };
    fetchFiles();
  }, []);

  return (
    <div>
      <label htmlFor="file-selector" className="block text-lg font-medium text-gray-700 mb-2">
        Select Uploaded File
      </label>
      <select
        id="file-selector"
        value={selectedFileUrl}
        onChange={(e) => setSelectedFileUrl(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none"
        disabled={disabled}
      >
        <option value="" disabled>Select a file</option>
        {files.map((file) => (
          <option key={file.name} value={file.url}>
            {file.name}
          </option>
        ))}
      </select>
      {/* For debugging urls files.map((file)=>(<div>{file.url}</div>))*/}
      
    </div>
  );
};

export default FileDropdown;
