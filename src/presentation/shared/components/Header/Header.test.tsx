import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';

describe('Header component', () => {
  it('toggles mobile nav when hamburger clicked and focuses first link', () => {
    render(<Header />);

    const btn = screen.getByRole('button', { name: /Open menu/i });
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-expanded')).toBe('false');

    // open menu
    fireEvent.click(btn);
    // button aria and label update
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(btn.getAttribute('aria-label')).toBe('Close menu');

    // mobile nav should be visible (aria-hidden="false") and first link focused
    const mobileNav = screen.getByRole('menu');
    expect(mobileNav.getAttribute('aria-hidden')).toBe('false');
    const firstLink = mobileNav.querySelector('a') as HTMLElement | null;
    expect(firstLink).toBeTruthy();
    // JSDOM may update focus synchronously in this component
    expect(document.activeElement).toBe(firstLink);

    // pressing Escape closes the menu
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(mobileNav.getAttribute('aria-hidden')).toBe('true');
  });

  it('closes mobile nav when backdrop clicked', () => {
    const { container } = render(<Header />);
    const btn = screen.getByRole('button', { name: /Open menu/i });
    fireEvent.click(btn);
    const mobileNav = screen.getByRole('menu');

    // find the backdrop element (a div with aria-hidden that is not the menu)
    const backdrop = container.querySelector(
      'div[aria-hidden="false"]:not(#mobile-nav)'
    ) as HTMLElement | null;
    expect(backdrop).toBeTruthy();

    // clicking backdrop should close
    fireEvent.click(backdrop!);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(mobileNav.getAttribute('aria-hidden')).toBe('true');
  });

  it('locks body scroll while mobile nav open and restores on close', () => {
    render(<Header />);
    const btn = screen.getByRole('button', { name: /Open menu/i });

    // open
    fireEvent.click(btn);
    expect(document.body.style.overflow).toBe('hidden');

    // close
    fireEvent.click(btn);
    // after close, overflow should be restored (empty string by default)
    expect(['', 'initial']).toContain(document.body.style.overflow);
  });

  it('clicking a mobile nav menu item closes the menu and clicking outside closes as well', () => {
    render(<Header />);
    const btn = screen.getByRole('button', { name: /Open menu/i });
    fireEvent.click(btn);
    const mobileNav = screen.getByRole('menu');

    // click a menu item (Journal) should close
    const journal = screen.getByRole('menuitem', { name: /Journal/i });
    fireEvent.click(journal);
    expect(mobileNav.getAttribute('aria-hidden')).toBe('true');

    // open again and simulate clicking outside via mousedown on document
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    fireEvent.mouseDown(document.body);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(mobileNav.getAttribute('aria-hidden')).toBe('true');
  });

  it('does not close when clicking inside mobile nav', () => {
    render(<Header />);
    const btn = screen.getByRole('button', { name: /Open menu/i });
    fireEvent.click(btn);
    const mobileNav = screen.getByRole('menu');
    const firstLink = mobileNav.querySelector('a') as HTMLElement | null;
    expect(firstLink).toBeTruthy();

    // simulate clicking inside nav: mousedown on link should NOT close the menu
    fireEvent.mouseDown(firstLink!);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(mobileNav.getAttribute('aria-hidden')).toBe('false');
  });
});
