import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Ingest from './pages/Ingest.jsx';
import Upload from './pages/Upload.jsx';
import Settings from './pages/Settings.jsx';
import './App.css';

function App() {
  return (
    <Router>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ingest" element={<Ingest />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
