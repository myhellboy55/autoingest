import React from 'react';
import './Navbar.css';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1 className="navbar-title">PhotoIngest</h1>
        <ul className="nav-links">
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/ingest">Ingest</Link></li>
          <li><Link to="/upload">Upload</Link></li>
          <li><Link to="/settings">Settings</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
