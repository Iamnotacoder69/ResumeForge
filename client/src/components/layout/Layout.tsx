import React from 'react';
import QwalifyHeader from './QwalifyHeader';
import QwalifyFooter from './QwalifyFooter';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <QwalifyHeader />
      <main className="flex-grow">
        {children}
      </main>
      <QwalifyFooter />
    </div>
  );
};

export default Layout;