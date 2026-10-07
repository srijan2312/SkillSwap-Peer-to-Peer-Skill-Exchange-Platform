import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

// Shared shell for every protected page: navbar on top, content below.
export default function Layout() {
  return (
    <div className="min-h-screen bg-base">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
