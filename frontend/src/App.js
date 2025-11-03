import React, { useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import "@/App.css";
import HomePage from "./HomePage";
import AdminPanel from "./AdminPanel";

function App() {
  // Cleanup old password system keys
  useEffect(() => {
    const keysToRemove = [
      'ae_admin_pwd_hash',
      'ae_admin_unlocked',
      'ae_admin_attempts',
      'ae_admin_lock_until',
      'ae_admin_first_login'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }, []);

  return (
    <div className="App">
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/araz79" element={<AdminPanel />} />
        </Routes>
      </HashRouter>
    </div>
  );
}

export default App;