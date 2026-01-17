
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/Home';
import HelpPage from './pages/Help';

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header title="Commission Auditor" />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/help" element={<HelpPage />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
