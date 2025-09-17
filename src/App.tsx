import React, { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';
import { Send, Bot, User, Sun, Moon, Trash2, X } from 'lucide-react';

// Main App Component
// =================================================================================

const App: React.FC = () => {
  // --- State Management ---
  const [darkMode, setDarkMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Types ---
  type Message = {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    timestamp: string;
  };

  // --- Effects ---

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auto-focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Bot reply simulation
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].sender === 'user') {
      setIsTyping(true);
      const timer = setTimeout(() => {
        const lastUserMessage = messages[messages.length - 1].text;
        const botMessage: Message = {
          id: Date.now(),
          text: `Echo: ${lastUserMessage}`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
        setIsTyping(false);
      }, 1500); // Simulate 1.5 second delay

      return () => clearTimeout(timer);
    }
  }, [messages]);


  // --- Event Handlers ---

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() === '') return;

    const userMessage: Message = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages([...messages, userMessage]);
    setInput('');
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage(e as unknown as FormEvent);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // --- Render ---

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <Header
        toggleDarkMode={toggleDarkMode}
        darkMode={darkMode}
        handleClearChat={handleClearChat}
      />
      <ChatArea
        messages={messages}
        isTyping={isTyping}
        chatEndRef={chatEndRef}
      />
      <InputBar
        input={input}
        setInput={setInput}
        handleSendMessage={handleSendMessage}
        handleKeyPress={handleKeyPress}
        inputRef={inputRef}
      />
    </div>
  );
};

// Header Component
// =================================================================================

type HeaderProps = {
  toggleDarkMode: () => void;
  darkMode: boolean;
  handleClearChat: () => void;
};

const Header: React.FC<HeaderProps> = ({ toggleDarkMode, darkMode, handleClearChat }) => (
  <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-md">
    <h1 className="text-xl font-bold text-gray-800 dark:text-white">Chatbot</h1>
    <div className="flex items-center space-x-4">
      <button onClick={handleClearChat} aria-label="Clear chat" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
        <Trash2 size={20} />
      </button>
      <button onClick={toggleDarkMode} aria-label="Toggle dark mode" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </div>
  </header>
);

// ChatArea Component
// =================================================================================

type ChatAreaProps = {
  messages: { id: number; text: string; sender: 'user' | 'bot'; timestamp: string }[];
  isTyping: boolean;
  chatEndRef: React.RefObject<HTMLDivElement>;
};

const ChatArea: React.FC<ChatAreaProps> = ({ messages, isTyping, chatEndRef }) => (
  <main className="flex-1 overflow-y-auto p-4 space-y-4">
    {messages.map((msg) => (
      <MessageBubble key={msg.id} {...msg} />
    ))}
    {isTyping && <TypingIndicator />}
    <div ref={chatEndRef} />
  </main>
);

// MessageBubble Component
// =================================================================================

type MessageBubbleProps = {
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ text, sender, timestamp }) => {
  const isUser = sender === 'user';
  return (
    <div className={`flex items-start gap-3 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <Avatar icon={<Bot size={24} />} />}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2">
           <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{isUser ? 'You' : 'Assistant'}</span>
        </div>
        <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${isUser ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white dark:bg-gray-700 dark:text-gray-200 rounded-bl-none'}`}>
          <p>{text}</p>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{timestamp}</span>
      </div>
       {isUser && <Avatar icon={<User size={24} />} />}
    </div>
  );
};


// Avatar Component
// =================================================================================

type AvatarProps = {
  icon: React.ReactNode;
};

const Avatar: React.FC<AvatarProps> = ({ icon }) => (
  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300">
    {icon}
  </div>
);

// TypingIndicator Component
// =================================================================================

const TypingIndicator: React.FC = () => (
  <div className="flex items-start gap-3 animate-fade-in">
    <Avatar icon={<Bot size={24} />} />
    <div className="p-3 rounded-2xl bg-white dark:bg-gray-700 dark:text-gray-200 rounded-bl-none">
      <div className="flex items-center space-x-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-short"></span>
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-short delay-150"></span>
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-short delay-300"></span>
      </div>
    </div>
  </div>
);

// InputBar Component
// =================================================================================

type InputBarProps = {
  input: string;
  setInput: (value: string) => void;
  handleSendMessage: (e: FormEvent) => void;
  handleKeyPress: (e: KeyboardEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement>;
};

const InputBar: React.FC<InputBarProps> = ({ input, setInput, handleSendMessage, handleKeyPress, inputRef }) => (
  <footer className="p-4 bg-white dark:bg-gray-800 shadow-t">
    <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type a message..."
        aria-label="Chat input"
        className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      />
      <button
        type="submit"
        aria-label="Send message"
        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
        disabled={!input.trim()}
      >
        <Send size={20} />
      </button>
    </form>
  </footer>
);

export default App;
