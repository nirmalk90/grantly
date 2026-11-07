import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider, useAppState } from '../state/AppState';
import { CommandPalette } from './CommandPalette';

function PageProbe() {
  const state = useAppState();
  return <p data-testid="page">{state.page}</p>;
}

describe('CommandPalette keyboard pattern', () => {
  it('uses one tab stop, moves the active option, and runs the selected command', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <AppProvider>
        <CommandPalette open onClose={onClose} onOpenProfile={vi.fn()} onOpenGuide={vi.fn()} />
        <PageProbe />
      </AppProvider>,
    );

    const input = screen.getByRole('combobox');
    expect(input).toHaveFocus();
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('tabindex', '-1');
    expect(input).toHaveAttribute('aria-activedescendant', options[0]?.id);

    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', options[1]?.id);
    await user.keyboard('{Enter}');
    expect(onClose).toHaveBeenCalled();
    expect(screen.getByTestId('page')).toHaveTextContent('discover');
  });
});
