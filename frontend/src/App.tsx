import React from 'react';
import { useAuthContext } from './hooks/useAuth';
import { AuthPage } from './pages/AuthPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';

export const App: React.FC = () => {
  const { user, isLoading, logout } = useAuthContext();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const currentRoute = new URLSearchParams(window.location.search).get('page') || 'projects';
  const projectId = new URLSearchParams(window.location.search).get('project');

  let content;
  if (!user || !localStorage.getItem('token')) {
    content = <AuthPage />;
  } else {
    if (currentRoute === 'project' && projectId) {
      content = <ProjectDetailPage />;
    } else {
      content = <ProjectsPage />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {user && (
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">TaskFlow</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">Hello, {user.name}</span>
              <button
                onClick={() => {
                  logout();
                  window.location.href = '/';
                }}
                className="text-slate-600 hover:text-slate-900 text-sm underline"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
      )}
      <main className="flex-1">
        {content}
      </main>
    </div>
  );
};

export default App;
