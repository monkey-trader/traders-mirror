import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';

describe('Header component', () => {
  it('toggles mobile nav when hamburger clicked and focuses first link', () => {
    const { container } = render(<Header />);

    const btn = screen.getByRole('button', { name: /Open menu/i });
    expect(btn).to.exist;
    expect(btn.getAttribute('aria-expanded')).to.equal('false');

    // open menu
    fireEvent.click(btn);
    // button aria and label update
    expect(btn.getAttribute('aria-expanded')).to.equal('true');
    expect(btn.getAttribute('aria-label')).to.equal('Close menu');

    // mobile nav should be visible (aria-hidden="false") and first link focused
    const mobileNav = screen.getByRole('menu');
    expect(mobileNav.getAttribute('aria-hidden')).to.equal('false');
    const firstLink = mobileNav.querySelector('a') as HTMLElement | null;
    expect(firstLink).to.exist;
    // JSDOM may update focus synchronously in this component
    expect(document.activeElement).to.equal(firstLink);

    // pressing Escape closes the menu
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(btn.getAttribute('aria-expanded')).to.equal('false');
    expect(mobileNav.getAttribute('aria-hidden')).to.equal('true');
  });

  it('closes mobile nav when backdrop clicked', () => {
    const { container } = render(<Header />);
    const btn = screen.getByRole('button', { name: /Open menu/i });
    fireEvent.click(btn);
    const mobileNav = screen.getByRole('menu');

    // find the backdrop element (a div with aria-hidden that is not the menu)
    const backdrop = container.querySelector('div[aria-hidden="false"]:not(#mobile-nav)') as HTMLElement | null;
    expect(backdrop).to.exist;

    // clicking backdrop should close
    fireEvent.click(backdrop!);
    expect(btn.getAttribute('aria-expanded')).to.equal('false');
    expect(mobileNav.getAttribute('aria-hidden')).to.equal('true');
  });

  it('locks body scroll while mobile nav open and restores on close', () => {
    render(<Header />);
    const btn = screen.getByRole('button', { name: /Open menu/i });

    // open
    fireEvent.click(btn);
    expect(document.body.style.overflow).to.equal('hidden');

    // close
    fireEvent.click(btn);
    // after close, overflow should be restored (empty string by default)
    expect(document.body.style.overflow === '' || document.body.style.overflow === 'initial').to.be.true;
  });

  it('clicking a mobile nav menu item closes the menu and clicking outside closes as well', () => {
    render(<Header />);
    const btn = screen.getByRole('button', { name: /Open menu/i });
    fireEvent.click(btn);
    const mobileNav = screen.getByRole('menu');

    // click a menu item (Journal) should close
    const journal = screen.getByRole('menuitem', { name: /Journal/i });
    fireEvent.click(journal);
    expect(mobileNav.getAttribute('aria-hidden')).to.equal('true');

    // open again and simulate clicking outside via mousedown on document
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).to.equal('true');
    fireEvent.mouseDown(document.body);
    expect(btn.getAttribute('aria-expanded')).to.equal('false');
    expect(mobileNav.getAttribute('aria-hidden')).to.equal('true');
  });

  it('does not close when clicking inside mobile nav', () => {
    const { container } = render(<Header />);
    const btn = screen.getByRole('button', { name: /Open menu/i });
    fireEvent.click(btn);
    const mobileNav = screen.getByRole('menu');
    const firstLink = mobileNav.querySelector('a') as HTMLElement | null;
    expect(firstLink).to.exist;

    // simulate clicking inside nav: mousedown on link should NOT close the menu
    fireEvent.mouseDown(firstLink!);
    expect(btn.getAttribute('aria-expanded')).to.equal('true');
    expect(mobileNav.getAttribute('aria-hidden')).to.equal('false');
  });
});
