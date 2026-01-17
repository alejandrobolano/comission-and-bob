import React from 'react';

interface ProcessButtonProps {
  isLoading: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

export const ProcessButton: React.FC<ProcessButtonProps> = ({
  isLoading,
  isDisabled,
  onClick
}) => (
  <div className="flex justify-center mb-10">
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`px-8 py-3 rounded-xl font-bold text-white transition-all transform active:scale-95 shadow-lg
        ${isDisabled ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
    >
      {isLoading ? 'Procesando...' : 'Ejecutar Reconciliación'}
    </button>
  </div>
);
