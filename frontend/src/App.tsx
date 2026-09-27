import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CreateWorkspaceModal } from './features/workspaces/components/CreateWorkspaceModal';
import { logout } from './store/authSlice';
import type { RootState } from './store/store';
import { useWorkspaces } from './features/workspaces/api/workspaces';

function App() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  
  // 1. Fetch workspaces using our new React Query hook
  const { data: workspaces, isLoading, isError } = useWorkspaces();
  
  // 2. State for the Create Workspace Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <>
    <CreateWorkspaceModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
    />
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* ========================================== */}
      {/* 1. SIDEBAR (The Navigation Menu)           */}
      {/* ========================================== */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-10">
        
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/30">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-wide">SyncForge</span>
        </div>

        {/* Navigation Links Area */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
                Your Workspaces
            </div>
            
            {/* Show a loading state in the sidebar if fetching */}
            {isLoading && (
                <div className="px-2 text-sm text-slate-500 animate-pulse">Loading...</div>
            )}
            
            {/* List the actual workspaces if we have them */}
            {!isLoading && workspaces && workspaces.length > 0 && workspaces.map(ws => (
                <button key={ws.id} className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-800 hover:text-white transition-colors group">
                    <svg className="w-5 h-5 mr-3 text-slate-500 group-hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    {ws.name}
                </button>
            ))}

            {!isLoading && (!workspaces || workspaces.length === 0) && (
                <div className="px-2 text-sm text-slate-500 italic">No workspaces found</div>
            )}
        </nav>

        {/* User Profile Area (Bottom of Sidebar) */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-inner">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="mt-4 w-full flex justify-center items-center px-4 py-2 text-sm font-medium text-slate-400 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 border border-slate-700 hover:border-red-500/30 rounded-lg transition-all duration-200"
          >
            Log Out
          </button>
        </div>
      </aside>


      {/* ========================================== */}
      {/* 2. MAIN CONTENT AREA (The Dashboard)       */}
      {/* ========================================== */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-0">
          <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
          <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
              + New Workspace
          </button>
        </header>

        {/* Main Content Body */}
        <div className="flex-1 overflow-auto p-8">
            
            {isLoading && (
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            )}

            {isError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
                    <p>Failed to load workspaces. Please refresh the page.</p>
                </div>
            )}

            {/* EMPTY STATE: Show this if the user has no workspaces! */}
            {!isLoading && !isError && workspaces && workspaces.length === 0 && (
                <div className="h-full flex items-center justify-center">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center transform transition-all hover:scale-[1.02] duration-300">
                        
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to SyncForge!</h2>
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            You don't belong to any workspaces yet. To start organizing your team's tasks and projects, you need to create your first workspace.
                        </p>
                        
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200 flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create First Workspace
                        </button>
                    </div>
                </div>
            )}

            {/* NORMAL STATE: Show this if they DO have workspaces */}
            {!isLoading && !isError && workspaces && workspaces.length > 0 && (
                 <div>
                     <h2 className="text-2xl font-bold text-slate-800 mb-6">Your Workspaces</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {workspaces.map(ws => (
                             <div key={ws.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer">
                                 <h3 className="text-lg font-bold text-slate-900 mb-2">{ws.name}</h3>
                                 <p className="text-slate-500 text-sm mb-4">{ws.description || 'No description provided.'}</p>
                                 <div className="text-xs text-slate-400">Created: {new Date(ws.createdAt).toLocaleDateString()}</div>
                             </div>
                         ))}
                     </div>
                 </div>
            )}

        </div>
      </main>
    </div>
    </>
  )
}

export default App