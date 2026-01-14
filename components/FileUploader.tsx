
import React from 'react';

interface FileUploaderProps {
  label: string;
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  id: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ label, onFileSelect, selectedFile, id }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 transition-colors bg-white shadow-sm">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        type="file"
        id={id}
        accept=".xlsx, .xls, .csv"
        onChange={handleFileChange}
        className="block w-full text-sm text-slate-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100 cursor-pointer"
      />
      {selectedFile && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-green-600 font-medium">✓ {selectedFile.name}</span>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
