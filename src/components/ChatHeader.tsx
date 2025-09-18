import React from 'react';
import { Menu, Moon, Sun, Settings, Trash2 } from 'lucide-react';

interface ChatHeaderProps {
  chatbotTitle: string;
  logo: string | null;
  darkMode: boolean;
  toggleDarkMode: () => void;
  handleClearChat: () => void;
  toggleSidebar: () => void;
  openSettingsModal: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  chatbotTitle,
  logo,
  darkMode,
  toggleDarkMode,
  handleClearChat,
  toggleSidebar,
  openSettingsModal,
}) => {
  return (
    <header className="bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 md:hidden">
          <Menu size={24} className="text-gray-600 dark:text-gray-300" />
        </button>
        {logo && <img src={logo} alt="logo" className="h-8 w-auto rounded-md" />}
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{chatbotTitle}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={toggleDarkMode} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
          {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-600" />}
        </button>
        <button onClick={handleClearChat} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
          <Trash2 size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        <button onClick={openSettingsModal} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
          <Settings size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
      </div>
    </header>
  );
};