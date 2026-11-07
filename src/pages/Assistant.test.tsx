import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Assistant from './Assistant';
import { renderApp } from '../test/render';
describe('Assistant reliability', () => {
  it('answers immediately and honestly before profile setup', async () => { const user = userEvent.setup(); renderApp(<Assistant onDetails={vi.fn()} />); await screen.findByLabelText('Ask the assistant a question'); await user.type(screen.getByLabelText('Ask the assistant a question'), 'What is the next deadline?'); await user.click(screen.getByRole('button', { name: 'Send message' })); expect(await screen.findByText(/Set up your profile first/)).toBeInTheDocument(); });
  it('only shows copied after clipboard success', async () => { const user = userEvent.setup(); const writeText = vi.fn().mockResolvedValue(undefined); Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true }); renderApp(<Assistant onDetails={vi.fn()} />); await user.click(await screen.findByRole('button', { name: 'Copy response text' })); expect(await screen.findByRole('button', { name: 'Response copied' })).toBeInTheDocument(); });
  it('does not claim success when clipboard is denied', async () => { const user = userEvent.setup(); const writeText = vi.fn().mockRejectedValue(new Error('denied')); Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true }); renderApp(<Assistant onDetails={vi.fn()} />); await user.click(await screen.findByRole('button', { name: 'Copy response text' })); await waitFor(() => expect(writeText).toHaveBeenCalled()); expect(screen.getByRole('button', { name: 'Copy response text' })).toBeInTheDocument(); });
});
