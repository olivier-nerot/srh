import React from 'react';
import { Outlet } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react";
import Header from './Header';
import Footer from './Footer';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <Outlet />
        <Analytics />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;