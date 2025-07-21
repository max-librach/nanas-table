import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      const isInHamburger = hamburgerRef.current && hamburgerRef.current.contains(event.target as Node);
      const isInMobileNav = mobileNavRef.current && mobileNavRef.current.contains(event.target as Node);
      if (!isInHamburger && !isInMobileNav) {
        setMobileNavOpen(false);
      }
    }
    if (menuOpen || mobileNavOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen, mobileNavOpen]);

  const userInitial = user?.displayName?.[0]?.toUpperCase() || 'U';

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-[1000]">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo and nav (desktop) */}
        <div className="flex items-center space-x-8 w-0 flex-1">
          <Link to="/" className="flex items-center space-x-2 whitespace-nowrap">
            <span className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-orange-200 to-pink-200 flex items-center justify-center">
              <img src="/nanas-table-logo.jpg" alt="Nana's Table Logo" className="w-full h-full object-cover" />
            </span>
            <span className="font-bold text-lg text-gray-800 whitespace-nowrap sm:text-lg text-base" style={{ fontSize: 'clamp(1rem, 2vw, 1.125rem)' }}>
              Nana's Table
            </span>
          </Link>
          {/* Desktop nav links */}
          <nav className="hidden sm:flex items-center space-x-6 ml-6">
            <Link
              to="/"
              className={`flex items-center gap-1 text-gray-700 hover:text-orange-600 font-medium transition ${location.pathname === '/' ? 'text-orange-600' : ''}`}
            >
              <span className="text-lg">🏠</span> Timeline
            </Link>
            <Link
              to="/recipes"
              className={`flex items-center gap-1 text-gray-700 hover:text-orange-600 font-medium transition ${location.pathname.startsWith('/recipes') ? 'text-orange-600' : ''}`}
            >
              <span className="text-lg">🍴</span> Recipes
            </Link>
          </nav>
        </div>
        {/* Desktop avatar */}
        <div className="hidden sm:block relative" ref={menuRef}>
          <button
            className="w-10 h-10 rounded-full bg-orange-200 text-orange-800 font-bold flex items-center justify-center text-lg shadow hover:bg-orange-300 transition"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="User menu"
          >
            {userInitial}
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
              <button
                onClick={signOut}
                className="w-full flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors text-left"
              >
                <LogOut className="h-5 w-5" /> Sign Out
              </button>
            </div>
          )}
        </div>
        {/* Mobile hamburger */}
        <div className="sm:hidden flex items-center">
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg hover:bg-orange-100 transition"
            ref={hamburgerRef}
            onClick={() => setMobileNavOpen(open => !open)}
            aria-label="Open navigation menu"
          >
            <Menu className="w-7 h-7 text-orange-600" />
          </button>
          {mobileNavOpen && (
            <div
              ref={mobileNavRef}
              className="absolute top-16 right-4 w-56 bg-white rounded-xl shadow-xl border border-orange-100 z-50 flex flex-col py-2"
            >
              <Link
                to="/"
                className={`flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 font-medium transition ${location.pathname === '/' ? 'text-orange-600' : ''}`}
                onClick={() => setMobileNavOpen(false)}
              >
                <span className="text-lg">🏠</span> Timeline
              </Link>
              <Link
                to="/recipes"
                className={`flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 font-medium transition ${location.pathname.startsWith('/recipes') ? 'text-orange-600' : ''}`}
                onClick={() => setMobileNavOpen(false)}
              >
                <span className="text-lg">🍴</span> Recipes
              </Link>
              <div className="border-t border-orange-100 my-2" />
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors text-left font-medium"
              >
                <span className="w-7 h-7 rounded-full bg-orange-200 text-orange-800 font-bold flex items-center justify-center text-base shadow mr-2">{userInitial}</span>
                <LogOut className="h-5 w-5" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};