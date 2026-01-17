
import React, { useState } from 'react';

interface AccordionItem {
  title: string;
  content: React.ReactNode;
  id: string;
}

interface AccordionProps {
  items: AccordionItem[];
}

const Accordion: React.FC<AccordionProps> = ({ items }) => {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id || null);

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div 
          key={item.id} 
          className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <button
            onClick={() => toggle(item.id)}
            className="w-full px-6 py-5 flex items-center justify-between text-left group"
          >
            <span className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
              {item.title}
            </span>
            <svg
              className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${
                openId === item.id ? 'rotate-180 text-blue-500' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              openId === item.id ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-6 pb-6 pt-0 border-t border-slate-50">
              {item.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Accordion;
