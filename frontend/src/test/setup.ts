import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Mock Plotly in jsdom environment
vi.mock('react-plotly.js', () => ({
  default: () => React.createElement('div', { 'data-testid': 'mock-plotly' }, 'Plotly Chart'),
}));

vi.mock('react-plotly.js/factory', () => ({
  default: () => () => React.createElement('div', { 'data-testid': 'mock-plotly' }, 'Plotly Chart'),
}));

vi.mock('plotly.js-dist-min', () => ({
  default: {},
}));
