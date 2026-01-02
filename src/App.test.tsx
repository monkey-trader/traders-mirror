import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

test('App renders header brand', () => {
  render(<App />);
  expect(screen.getByText(/Traders Mirror/i)).toBeInTheDocument();
});
