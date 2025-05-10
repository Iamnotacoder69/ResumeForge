import React from 'react';
import { Link } from 'wouter';

const QwalifyHeader: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/">
              <a className="flex items-center">
                <svg 
                  width="36" 
                  height="36" 
                  viewBox="0 0 36 36" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2"
                >
                  <rect width="36" height="36" rx="8" fill="#03d27c" fillOpacity="0.15" />
                  <path 
                    d="M25.5 10.5H10.5C9.675 10.5 9 11.175 9 12V24C9 24.825 9.675 25.5 10.5 25.5H25.5C26.325 25.5 27 24.825 27 24V12C27 11.175 26.325 10.5 25.5 10.5ZM15 23.25H12V20.25H15V23.25ZM15 18.75H12V15.75H15V18.75ZM15 14.25H12V11.25H15V14.25ZM21 23.25H15.75V20.25H21V23.25ZM21 18.75H15.75V15.75H21V18.75ZM21 14.25H15.75V11.25H21V14.25ZM24.75 23.25H21.75V20.25H24.75V23.25ZM24.75 18.75H21.75V15.75H24.75V18.75ZM24.75 14.25H21.75V11.25H24.75V14.25Z" 
                    fill="#03d27c" 
                  />
                </svg>
                <span className="text-[#043e44] font-bold text-2xl tracking-tight">Qwalify</span>
              </a>
            </Link>
          </div>
          <nav className="flex space-x-4">
            <Link href="/">
              <a className="text-[#043e44] hover:text-[#03d27c] px-3 py-2 text-sm font-medium transition-colors">
                Home
              </a>
            </Link>
            <Link href="/cv-builder">
              <a className="text-[#043e44] hover:text-[#03d27c] px-3 py-2 text-sm font-medium transition-colors">
                Create CV
              </a>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default QwalifyHeader;