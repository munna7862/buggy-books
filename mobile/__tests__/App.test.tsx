import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

describe('BuggyBooks Mobile App Entry', () => {
  it('renders the header title and dual-auth status correctly', () => {
    const { getByText } = render(<App />);

    expect(getByText('BuggyBooks')).toBeTruthy();
    expect(getByText('Dual-Auth Session Active')).toBeTruthy();
    expect(getByText('Bearer Token Supported')).toBeTruthy();
    expect(getByText('The Clean Architecture Guide')).toBeTruthy();
  });
});
