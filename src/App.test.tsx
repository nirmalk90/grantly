import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import App from './App';
describe('Workspace integration', () => {
  it('opens directly to the product, passes structural accessibility checks and prevents stacked dialogs', async () => {
    window.history.replaceState({}, '', '/'); const user = userEvent.setup(); render(<App />);
    await screen.findByRole('heading', { name: 'Your scholarship journey starts here.' });
    expect(screen.queryByRole('button', { name: 'Enter workspace' })).not.toBeInTheDocument();
    const results = await axe.run(document.body, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }, rules: { 'color-contrast': { enabled: false } } }); expect(results.violations).toEqual([]);
    await user.click(screen.getByRole('link', { name: 'Find scholarships' }));
    const details = (await screen.findAllByRole('button', { name: /View details for/ }))[0]; if (!details) throw new Error('details'); await user.click(details); expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Control>}k{/Control}'); expect(screen.getAllByRole('dialog')).toHaveLength(1); await user.keyboard('{Escape}'); expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); expect(screen.getByRole('link', { name: 'Find scholarships' })).toHaveAttribute('aria-current', 'page');
  });
});
