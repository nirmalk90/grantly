import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../state/AppState';
import Assistant from './Assistant';

function renderAssistant() {
  return render(
    <AppProvider>
      <Assistant onDetails={vi.fn()} />
    </AppProvider>,
  );
}

describe('Assistant reliability', () => {
  it('answers immediately without an artificial typing delay', async () => {
    const user = userEvent.setup();
    renderAssistant();
    await user.type(screen.getByLabelText('Ask the assistant a question'), 'What is the next deadline?');
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    expect(await screen.findByText(/earliest eligible deadlines/)).toBeInTheDocument();
  });

  it('only shows copied state after clipboard success', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderAssistant();
    await user.click(screen.getByRole('button', { name: 'Copy response text' }));
    expect(await screen.findByRole('button', { name: 'Response copied' })).toHaveTextContent('Copied ✓');
    expect(writeText).toHaveBeenCalled();
  });

  it('does not claim success when clipboard permission is denied', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderAssistant();
    await user.click(screen.getByRole('button', { name: 'Copy response text' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Copy response text' })).toHaveTextContent('Copy response');
    });
    expect(writeText).toHaveBeenCalled();
  });
});
