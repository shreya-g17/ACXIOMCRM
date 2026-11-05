import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { RiMenuLine } from 'react-icons/ri';
import Sidebar from './Sidebar';

export default function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      <div className="main-content">
        <button className="btn btn-outline btn-sm menu-toggle" type="button" onClick={() => setOpen((v) => !v)}>
          <RiMenuLine /> Menu
        </button>
        <div className="page-content fade-up">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
