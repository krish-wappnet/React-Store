// src/components/__tests__/Login.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import toast from 'react-hot-toast';
import Login from '../Login';

// Import Jest types
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

// Mock definitions must come before jest.mock calls
const mockUseNavigate = jest.fn();
const mockUseAuth = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

// Mock useNavigate, useAuth, and toast
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockUseNavigate,
}));

jest.mock('../../context/useAuth', () => ({
  useAuth: mockUseAuth, // Directly use the mock function
}));

jest.mock('react-hot-toast', () => ({
  success: mockToastSuccess,
  error: mockToastError,
}));

describe('Login Component', () => {
  let loginMock: jest.Mock<(username: string, password: string) => Promise<void>>;

  beforeEach(() => {
    loginMock = jest.fn<(username: string, password: string) => Promise<void>>();
    mockUseNavigate.mockClear();
    mockUseAuth.mockClear();
    mockToastSuccess.mockClear();
    mockToastError.mockClear();

    // Default mock return value for useAuth
    mockUseAuth.mockReturnValue({ login: loginMock, user: null });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form with inputs and button', () => {
    render(<Login />);
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  test('updates username and password state on input change', () => {
    render(<Login />);
    const usernameInput = screen.getByPlaceholderText('Enter your username');
    const passwordInput = screen.getByPlaceholderText('Enter your password');

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('password123');
  });

  test('handles successful login and navigates to /admin for admin', async () => {
    mockUseAuth.mockReturnValue({ login: loginMock, user: { role: 'admin' } });

    render(<Login />);
    const usernameInput = screen.getByPlaceholderText('Enter your username');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByText('Login');

    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'adminpass' } });
    loginMock.mockResolvedValueOnce(undefined);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('admin', 'adminpass');
      expect(mockToastSuccess).toHaveBeenCalledWith('Logged in as admin!');
      expect(mockUseNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  test('handles successful login and navigates to / for user', async () => {
    mockUseAuth.mockReturnValue({ login: loginMock, user: { role: 'user' } });

    render(<Login />);
    const usernameInput = screen.getByPlaceholderText('Enter your username');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByText('Login');

    fireEvent.change(usernameInput, { target: { value: 'user' } });
    fireEvent.change(passwordInput, { target: { value: 'userpass' } });
    loginMock.mockResolvedValueOnce(undefined);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('user', 'userpass');
      expect(mockToastSuccess).toHaveBeenCalledWith('Logged in as user!');
      expect(mockUseNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('handles failed login with error toast', async () => {
    mockUseAuth.mockReturnValue({ login: loginMock, user: null });

    render(<Login />);
    const usernameInput = screen.getByPlaceholderText('Enter your username');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByText('Login');

    fireEvent.change(usernameInput, { target: { value: 'wrong' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    loginMock.mockRejectedValueOnce(new Error('Invalid credentials'));
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('wrong', 'wrongpass');
      expect(mockToastError).toHaveBeenCalledWith('Invalid credentials');
      expect(mockUseNavigate).not.toHaveBeenCalled();
    });
  });
});