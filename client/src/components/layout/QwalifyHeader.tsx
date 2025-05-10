import React from 'react';
import { Link } from 'wouter';

export const QwalifyHeader: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-qwalify-dark to-qwalify-green py-4 shadow-md">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/">
          <a className="flex items-center space-x-2 cursor-pointer">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              <path
                d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 25.2c-6.186 0-11.2-5.014-11.2-11.2S9.814 4.8 16 4.8 27.2 9.814 27.2 16 22.186 27.2 16 27.2z"
                fill="white"
              />
              <path
                d="M20.5 11.5l-6 6-3-3-1.5 1.5 4.5 4.5 7.5-7.5-1.5-1.5z"
                fill="white"
              />
            </svg>
            <div className="flex flex-col">
              <span className="text-white text-2xl font-bold tracking-tight">Qwalify</span>
              <span className="text-white/80 text-xs">Professional CV Builder</span>
            </div>
          </a>
        </Link>
        
        <nav className="hidden md:flex space-x-6">
          <Link href="/">
            <a className="text-white hover:text-white/80 transition-colors">
              Home
            </a>
          </Link>
          <Link href="/builder">
            <a className="text-white hover:text-white/80 transition-colors">
              CV Builder
            </a>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default QwalifyHeader;