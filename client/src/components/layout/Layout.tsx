import React from 'react';
import QwalifyHeader from './QwalifyHeader';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <QwalifyHeader />
      <div className="flex-grow">
        {children}
      </div>
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-[#043e44] text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} Qwalify. Create professional CVs in minutes.
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-[#043e44] hover:text-[#03d27c] text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-[#043e44] hover:text-[#03d27c] text-sm">
                Terms of Service
              </a>
              <a href="#" className="text-[#043e44] hover:text-[#03d27c] text-sm">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;