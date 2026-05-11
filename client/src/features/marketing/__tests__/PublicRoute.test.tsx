// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PublicRoute } from '@/core/router';
import type { UserRole } from '@/core/types';

interface MockAuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  loading: boolean;
}

const authState: MockAuthState = {
  isAuthenticated: false,
  role: null,
  loading: false,
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

function setAuth(state: Partial<MockAuthState>): void {
  Object.assign(authState, { isAuthenticated: false, role: null, loading: false }, state);
}

function renderRoute(initialPath = '/'): void {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/" element={<div>Landing</div>} />
        </Route>
        <Route path="/dashboard" element={<div>UserHome</div>} />
        <Route path="/doctor/dashboard" element={<div>DoctorHome</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PublicRoute', () => {
  it('renders children for unauthenticated visitors', () => {
    setAuth({ isAuthenticated: false });
    renderRoute();
    expect(screen.getByText('Landing')).toBeInTheDocument();
  });

  it('redirects authenticated user role to /dashboard', () => {
    setAuth({ isAuthenticated: true, role: 'user' });
    renderRoute();
    expect(screen.getByText('UserHome')).toBeInTheDocument();
  });

  it('redirects authenticated doctor role to /doctor/dashboard', () => {
    setAuth({ isAuthenticated: true, role: 'doctor' });
    renderRoute();
    expect(screen.getByText('DoctorHome')).toBeInTheDocument();
  });

  it('renders nothing while auth state is loading', () => {
    setAuth({ loading: true });
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/" element={<div>Landing</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(container.textContent).toBe('');
  });
});
