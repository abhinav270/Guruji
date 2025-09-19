import React from 'react';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Left Side */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center bg-gray-800 text-white p-12">
        <div className="w-32 h-32 bg-gray-700 rounded-full mb-6"></div>
        <h1 className="text-4xl font-bold mb-4">Your Tool</h1>
        <p className="text-lg text-center">
          Welcome to your new favorite tool. Sign in to continue.
        </p>
      </div>
      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
            Login or Sign Up
          </h2>
          <div className="space-y-4">
            <button
              onClick={onLogin}
              className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
            >
              <span>Sign in with Organization SSO</span>
            </button>
            <button
              onClick={onLogin}
              className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
            >
              <span>Sign in with Google</span>
            </button>
            <button
              onClick={onLogin}
              className="w-full flex items-center justify-center bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
            >
              <span>Sign in with GitHub</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
