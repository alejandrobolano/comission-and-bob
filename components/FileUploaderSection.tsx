import React from 'react';

interface FileUploaderSectionProps {
  bobFile: File | null;
  commFile: File | null;
  onBobFileSelect: (file: File) => void;
  onCommFileSelect: (file: File) => void;
}

interface FileInputProps {
  id: string;
  label: string;
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
}

const FileInput: React.FC<FileInputProps> = ({ id, label, selectedFile, onFileSelect }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
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

export const FileUploaderSection: React.FC<FileUploaderSectionProps> = ({
  bobFile,
  commFile,
  onBobFileSelect,
  onCommFileSelect
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
    <FileInput
      id="bob"
      label="1. Book of Business (Source)"
      selectedFile={bobFile}
      onFileSelect={onBobFileSelect}
    />
    <FileInput
      id="comm"
      label="2. Commission Report (Target)"
      selectedFile={commFile}
      onFileSelect={onCommFileSelect}
    />
  </div>
);
