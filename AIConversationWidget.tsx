import React, { useState } from 'react';
import { Bot, X } from 'lucide-react';
import AIConversationAnalyzer from './AIConversationAnalyzer';

const AIConversationWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center group z-50 animate-bounce-slow"
          title="Ouvrir l'assistant IA"
        >
          <Bot className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />

          {/* Pulse animation */}
          <span className="absolute inset-0 rounded-full bg-purple-600 opacity-75 animate-ping" />
        </button>
      )}

      {/* Fullscreen Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 animate-in fade-in duration-300">
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="fixed top-6 right-6 p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full transition-all duration-300 z-50 shadow-lg"
            title="Fermer"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Content */}
          <AIConversationAnalyzer />
        </div>
      )}

    </>
  );
};

export default AIConversationWidget;
