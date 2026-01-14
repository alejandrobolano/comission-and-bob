import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 py-6 mt-12 text-center border-t border-slate-700">
      <p className="text-sm">
        Created By Alejandro Bolaño | {currentYear} | Powered By Smart Tech Lite
      </p>
    </footer>
  );
};

export default Footer;
