import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-sm bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          {/* Tabs */}
          <div className="flex border-b border-gray-300 dark:border-gray-700 mb-4">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 text-center font-semibold transition-colors duration-300 ${
                authMode === 'login'
                  ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 text-center font-semibold transition-colors duration-300 ${
                authMode === 'signup'
                  ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          <h2 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-white">
            {authMode === 'login' ? 'Login' : 'Create an Account'}
          </h2>

          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
            {authMode === 'signup' && (
              <div className="mb-3">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-1" htmlFor="name">
                  Full Name
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  required
                />
              </div>
            )}
            <div className="mb-3">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-1" htmlFor="email">
                Email Address
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="email"
                type="email"
                placeholder="email@example.com"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-1" htmlFor="password">
                Password
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="password"
                type="password"
                placeholder="******************"
                required
              />
            </div>
            <div className="mb-4">
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
              >
                {authMode === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </form>

          {/* Separator */}
          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            <span className="mx-4 text-gray-500 dark:text-gray-400 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
          </div>

          {/* SSO Buttons */}
          <div className="space-y-3">
            <button
              onClick={onLogin}
              type="button"
              className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
              <span>Sign in with Organization SSO</span>
            </button>
            <button
              onClick={onLogin}
              type="button"
              className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
              <span>Sign in with Google</span>
            </button>
            <button
              onClick={onLogin}
              type="button"
              className="w-full flex items-center justify-center bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
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
