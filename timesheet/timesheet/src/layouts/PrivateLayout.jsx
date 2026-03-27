import React from 'react';
import Sidebar from '../components/Sidebar';

const PrivateLayout = ({ children }) => {
  return (
    <div className="app-shell">
      <Sidebar />

      <main className="app-main">
        {children}
      </main>
    </div>
  );
};

export default PrivateLayout;
