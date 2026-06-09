
'use client';

import Navbar from './Navbar';
import BrowserControls from './BrowserControls';
import SessionInfo from './SessionInfo';
import BrowserViewer from './BrowserViewer';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      <main className="mx-auto max-w-screen-2xl px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Left Panel */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-3">
            <BrowserControls />
            <SessionInfo />
          </div>

          {/* Right Panel */}
          <div className="flex-1 min-h-0">
            <BrowserViewer />
          </div>
        </div>
      </main>
    </div>
  );
}
