// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return { ...actual, useReducedMotion: () => true };
});

beforeEach(() => {
  navigateMock.mockReset();
});

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

describe('LandingPage', () => {
  it('renders a single h1 with the marketing headline', () => {
    renderLanding();
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(/A New Paradigm for/i);
    expect(headings[0]).toHaveTextContent(/Mental Wellbeing/i);
  });

  it('navigates to /login when primary CTAs are clicked', () => {
    renderLanding();
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    expect(navigateMock).toHaveBeenLastCalledWith('/login');

    fireEvent.click(screen.getByRole('button', { name: /Get Started$/i }));
    expect(navigateMock).toHaveBeenLastCalledWith('/login');

    fireEvent.click(screen.getByRole('button', { name: /Get Started Free/i }));
    expect(navigateMock).toHaveBeenLastCalledWith('/login');

    fireEvent.click(screen.getByRole('button', { name: /Start Your Journey/i }));
    expect(navigateMock).toHaveBeenLastCalledWith('/login');
  });

  it('scrolls to #features when Watch Demo is clicked', () => {
    const scrollMock = vi.fn();
    Element.prototype.scrollIntoView = scrollMock as unknown as typeof Element.prototype.scrollIntoView;

    renderLanding();
    const target = document.getElementById('features');
    expect(target).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Watch Demo/i }));
    expect(scrollMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('renders six feature cards', () => {
    renderLanding();
    const featureHeadings = screen.getAllByRole('heading', { level: 3 });
    expect(featureHeadings).toHaveLength(6);
  });

  it('marks the hero image as decorative', () => {
    renderLanding();
    const img = document.querySelector('img[src="/hero_image.png"]');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('alt')).toBe('');
    expect(img?.getAttribute('aria-hidden')).toBe('true');
  });
});
