import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CommandPalette } from './CommandPalette';
import { renderApp } from '../test/render';
function Probe() { const location = useLocation(); return <p data-testid="page">{location.pathname}</p>; }
describe('CommandPalette keyboard pattern', () => {
  it('uses one tab stop and navigates to a real URL', async () => {
    const user = userEvent.setup(); const onClose = vi.fn();
    renderApp(<><CommandPalette open onClose={onClose} onOpenProfile={vi.fn()} onOpenGuide={vi.fn()} /><Probe /></>);
    const input = await screen.findByRole('combobox'); expect(input).toHaveFocus(); const options = screen.getAllByRole('option'); expect(options[0]).toHaveAttribute('tabindex', '-1');
    await user.keyboard('{ArrowDown}{Enter}'); expect(onClose).toHaveBeenCalled(); expect(screen.getByTestId('page')).toHaveTextContent('/discover');
  });
});
