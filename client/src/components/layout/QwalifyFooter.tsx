import React from 'react';

const QwalifyFooter: React.FC = () => {
  return (
    <footer className="mt-auto py-6 bg-gradient-to-r from-qwalify-dark/95 to-qwalify-green/95">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:justify-between items-center">
          <div className="text-white mb-4 md:mb-0">
            <span className="font-bold">Qwalify</span> © {new Date().getFullYear()} - Professional CV Builder
          </div>
          
          <div className="flex space-x-4">
            <a href="#" className="text-white hover:text-qwalify-light transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-white hover:text-qwalify-light transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-white hover:text-qwalify-light transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default QwalifyFooter;