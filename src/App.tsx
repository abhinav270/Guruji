import React, { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatView, Message } from './components/ChatView';
import { PromptModal, PromptTemplate } from './components/PromptModal';
import { SettingsModal } from './components/SettingsModal';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal';
import LoginPage from './components/LoginPage';
import { v4 as uuidv4 } from 'uuid';

// --- Type Definitions ---
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

export interface KnowledgeBase {
  id: string;
  name: string;
  vector_store: string;
  file_names: string[];
  created_at: string;
}

// =================================================================================
// --- Main App Component ---
// =================================================================================
const App: React.FC = () => {
  // --- State Management ---
  const [logo, setLogo] = useState<string | null>(null);
  const [chatbotTitle, setChatbotTitle] = useState('Chatbot');
  const [themeColor, setThemeColor] = useState('#007bff');
  const [darkMode, setDarkMode] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([
    { id: '1', title: 'Summarize Text', text: 'Please summarize the following text:\n\n' }
  ]);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptToEdit, setPromptToEdit] = useState<PromptTemplate | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isKbModalOpen, setIsKbModalOpen] = useState(false);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Derived State ---
  const activeChat = chatSessions.find(session => session.id === activeChatId);
  const filteredChatSessions = chatSessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Effects ---

  // Initialize with a default chat session
  useEffect(() => {
    if (chatSessions.length === 0) {
      const newId = uuidv4();
      setChatSessions([{ id: newId, title: 'New Chat', messages: [] }]);
      setActiveChatId(newId);
    }
  }, [chatSessions.length]);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Apply theme color
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', themeColor);
  }, [themeColor]);

  // Auto-focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeChatId]); // Refocus when chat changes

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages, isTyping]);

  // Fetch knowledge bases on mount
  useEffect(() => {
    const fetchKnowledgeBases = async () => {
      try {
        const response = await fetch('http://localhost:8000/kb/list');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setKnowledgeBases(data.knowledge_bases);
      } catch (error) {
        console.error("Failed to fetch knowledge bases:", error);
      }
    };
    fetchKnowledgeBases();
  }, []);

  // Bot reply simulation
  useEffect(() => {
    const messages = activeChat?.messages ?? [];
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

        setChatSessions(prevSessions =>
          prevSessions.map(session =>
            session.id === activeChatId
              ? { ...session, messages: [...session.messages, botMessage] }
              : session
          )
        );
        setIsTyping(false);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [activeChat?.messages, activeChatId]);

  // --- Event Handlers ---

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() === '' || !activeChatId) return;

    const userMessage: Message = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
    };

    setChatSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === activeChatId
          ? { ...session, messages: [...session.messages, userMessage] }
          : session
      )
    );
    setInput('');
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage(e as unknown as FormEvent);
    }
  };

  const handleNewChat = () => {
    const newId = uuidv4();
    const newChat: ChatSession = {
      id: newId,
      title: 'New Chat',
      messages: [],
    };
    setChatSessions(prev => [newChat, ...prev]);
    setActiveChatId(newId);
  };

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
  };

  const handleDeleteChat = (id: string) => {
    setChatSessions(prev => prev.filter(session => session.id !== id));
    // If the active chat is deleted, switch to another one or set to null
    if (activeChatId === id) {
      setActiveChatId(chatSessions[0]?.id || null);
    }
  };

  const handleClearChat = () => {
    if (!activeChatId) return;
    setChatSessions(prevSessions =>
        prevSessions.map(session =>
          session.id === activeChatId
            ? { ...session, messages: [] }
            : session
        )
      );
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // --- Prompt/Tool Handlers ---
  const handleSavePrompt = (promptData: Omit<PromptTemplate, 'id'> & { id?: string }) => {
    if (promptData.id) { // Editing existing prompt
      setPromptTemplates(prev => prev.map(p => p.id === promptData.id ? { ...p, title: promptData.title, text: promptData.text } : p));
    } else { // Creating new prompt
      setPromptTemplates(prev => [...prev, { ...promptData, id: uuidv4() }]);
    }
  };

  const handleDeletePrompt = (id: string) => {
    setPromptTemplates(prev => prev.filter(p => p.id !== id));
  };

  const handleUsePrompt = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const openNewPromptModal = () => {
    setPromptToEdit(null);
    setIsPromptModalOpen(true);
  };

  const openEditPromptModal = (prompt: PromptTemplate) => {
    setPromptToEdit(prompt);
    setIsPromptModalOpen(true);
  };

  const handleSaveKnowledgeBase = async (data: any) => {
    const formData = new FormData();
    formData.append('kb_name', data.kbName);
    formData.append('vector_store', data.vectorStore);
    formData.append('parsing_library', data.parsingLibrary);
    // Note: allowed_file_types is not part of the backend endpoint, so we omit it.

    data.files.forEach((file: File) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('http://localhost:8000/kb/create', {
        method: 'POST',
        body: formData, // No 'Content-Type' header needed; browser sets it with boundary
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('KB Creation Success:', result);
      // Add the new KB to the state and refresh the list
      setKnowledgeBases(prev => [...prev, result.data]);
      // Optionally, select the new KB
      setSelectedKnowledgeBaseId(result.data.id);
    } catch (error) {
      console.error("Failed to create Knowledge Base:", error);
      // You could add an error notification here
    }
  };

  const handleSelectKnowledgeBase = async (id: string) => {
    setSelectedKnowledgeBaseId(id);
    try {
      const response = await await fetch(`http://localhost:8000/kb/select?kb_id=${id}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log(`Selected KB: ${id}`);
    } catch (error) {
      console.error("Failed to select Knowledge Base:", error);
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  // --- Render ---

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <Sidebar
        isOpen={isSidebarOpen}
        chatSessions={filteredChatSessions}
        activeChatId={activeChatId}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      onNewChat={handleNewChat}
      onSelectChat={handleSelectChat}
      onDeleteChat={handleDeleteChat}
      promptTemplates={promptTemplates}
      onNewPrompt={openNewPromptModal}
      onEditPrompt={openEditPromptModal}
      onDeletePrompt={handleDeletePrompt}
      onUsePrompt={handleUsePrompt}
      onNewKnowledgeBase={() => setIsKbModalOpen(true)}
      knowledgeBases={knowledgeBases}
      selectedKnowledgeBaseId={selectedKnowledgeBaseId}
      onSelectKnowledgeBase={handleSelectKnowledgeBase}
      />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : ''}`}>
        <ChatView
          messages={activeChat?.messages ?? []}
          isTyping={isTyping}
        input={input}
        setInput={setInput}
        handleSendMessage={handleSendMessage}
        inputRef={inputRef}
        chatEndRef={chatEndRef}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        handleClearChat={handleClearChat}
        handleKeyPress={handleKeyPress}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        openSettingsModal={() => setIsSettingsModalOpen(true)}
        chatbotTitle={chatbotTitle}
        logo={logo}
        isSidebarOpen={isSidebarOpen}
      />
      </div>
      <PromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        onSave={handleSavePrompt}
        promptToEdit={promptToEdit}
      />
      <KnowledgeBaseModal
        isOpen={isKbModalOpen}
        onClose={() => setIsKbModalOpen(false)}
        onSave={handleSaveKnowledgeBase}
        themeColor={themeColor}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        themeColor={themeColor}
        setThemeColor={setThemeColor}
        chatbotTitle={chatbotTitle}
        setChatbotTitle={setChatbotTitle}
        logo={logo}
        setLogo={setLogo}
      />
    </div>
  );
};

export default App;
