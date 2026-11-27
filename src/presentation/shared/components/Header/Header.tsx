import React, { useState, useRef, useEffect } from 'react';
import styles from './Header.module.css';
import { useAuth } from '@/presentation/auth/AuthProvider';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  // Close on Escape or when clicking outside the mobile nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node | null;
      if (!mobileOpen) return;
      if (navRef.current && navRef.current.contains(target)) return;
      if (btnRef.current && btnRef.current.contains(target)) return;
      setMobileOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDocClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDocClick);
    };
  }, [mobileOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = prev || '';
    }
    return () => {
      document.body.style.overflow = prev || '';
    };
  }, [mobileOpen]);

  // When opening, focus the first link for accessibility
  useEffect(() => {
    if (mobileOpen && navRef.current) {
      const first = navRef.current.querySelector('a') as HTMLElement | null;
      first?.focus();
    }
  }, [mobileOpen]);

  return (
    <header className={styles.header}>
      <div className={styles.brand}>Traders Mirror</div>

      <nav className={styles.nav}>
        <a href="#/journal">Journal</a>
        <a href="#/analysis">Analyse</a>
        <a href="#/settings">Settings</a>
      </nav>

      <button
        ref={btnRef}
        type="button"
        className={styles.hamburger}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
        aria-controls="mobile-nav"
        onClick={() => setMobileOpen((v) => !v)}
      >
        {/* simple three-lines icon */}
        <svg
          width="20"
          height="14"
          viewBox="0 0 20 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <rect y="1" width="20" height="2" rx="1" fill="currentColor" />
          <rect y="6" width="20" height="2" rx="1" fill="currentColor" />
          <rect y="11" width="20" height="2" rx="1" fill="currentColor" />
        </svg>
      </button>

      {/* Backdrop shown behind mobile nav to dim page and catch outside clicks */}
      <div
        className={`${styles.backdrop} ${mobileOpen ? styles.backdropVisible : ''}`}
        aria-hidden={!mobileOpen}
        onClick={() => setMobileOpen(false)}
      />

      <div
        id="mobile-nav"
        ref={navRef}
        className={`${styles.mobileNav} ${mobileOpen ? styles.mobileOpen : ''}`}
        role="menu"
        aria-hidden={!mobileOpen}
      >
        <a href="#/journal" role="menuitem" onClick={() => setMobileOpen(false)}>
          Journal
        </a>
        <a href="#/analysis" role="menuitem" onClick={() => setMobileOpen(false)}>
          Analyse
        </a>
        <a href="#/settings" role="menuitem" onClick={() => setMobileOpen(false)}>
          Settings
        </a>
      </div>

      <div className={styles.controls}>
        <AuthControls />
      </div>
    </header>
  );
}

function AuthControls() {
  const { user, loading, error, signIn, signOut, clearError } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node | null;
      if (!menuOpen) return;
      if (menuRef.current && menuRef.current.contains(target)) return;
      setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  // Show a compact banner for auth error; allow dismiss
  const showError = !!error;

  return (
    <div className={styles.authWrap}>
      {showError && (
        <div role="alert" className={styles.authError} onAnimationEnd={clearError}>
          {error}
        </div>
      )}
      {user ? (
        <div className={styles.userBadge} ref={menuRef}>
          <button
            type="button"
            className={styles.userBtn}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="avatar" className={styles.avatar} />
            ) : (
              <div className={styles.avatarFallback} aria-hidden>{user.displayName?.[0] || 'U'}</div>
            )}
            <span className={styles.userName}>{user.displayName || user.email || 'User'}</span>
          </button>
          <div className={`${styles.userMenu} ${menuOpen ? styles.userMenuOpen : ''}`} role="menu">
            <button
              type="button"
              className={`${styles.authBtn} ${styles.logout}`}
              onClick={() => {
                setMenuOpen(false);
                void signOut();
              }}
              disabled={loading}
            >
              Logout
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={`${styles.authBtn} ${styles.login}`}
          onClick={() => void signIn()}
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Login mit Google'}
        </button>
      )}
    </div>
  );
}
