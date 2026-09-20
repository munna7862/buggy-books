import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import App from '../App';

describe('BuggyBooks Mobile App Entry', () => {
  it('renders the root app with login screen when unauthenticated (MOB_AUTH_01)', async () => {
    const { getByText, getAllByText, getByTestId } = render(<App />);

    await waitFor(() => {
      expect(getAllByText('🐛 BuggyBooks').length).toBeGreaterThanOrEqual(1);
      expect(getByText('Welcome Back')).toBeTruthy();
      expect(getByTestId('txt_usr_77')).toBeTruthy();
      expect(getByTestId('txt_pwd_99')).toBeTruthy();
      expect(getByTestId('button-login')).toBeTruthy();
      expect(getByTestId('link-register')).toBeTruthy();
    });
  });
});
