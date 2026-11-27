import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import { AuthProvider } from '@/presentation/auth/AuthProvider';

test('App renders header brand', () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  expect(screen.getByText(/Traders Mirror/i)).toBeInTheDocument();
});
