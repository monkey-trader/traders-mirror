import React, { useState, useRef, useEffect } from 'react';
import styles from './Header.module.css';
import { UserBadge } from '@/presentation/auth/UserBadge';
import { RepoSyncStatus } from '@/presentation/shared/components/RepoSyncStatus/RepoSyncStatus';

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
        {/* Sync status indicator + User avatar/name */}
        <RepoSyncStatus />
        <UserBadge />
      </div>
    </header>
  );
}

// Auth controls are provided by UserBadge in this branch.
