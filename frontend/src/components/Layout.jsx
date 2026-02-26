// src/components/Layout.jsx
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <main className="ml-64 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
