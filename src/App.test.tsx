import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('Workspace integration', () => {
  it('enters the workspace, passes structural accessibility checks, and prevents stacked dialogs', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Enter workspace' }));
    await screen.findByRole('heading', { name: /Good / });

    const results = await axe.run(document.body, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);

    const details = screen.getAllByRole('button', { name: /View details for/ })[0];
    if (details === undefined) throw new Error('Expected at least one scholarship details button');
    await user.click(details);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Control>}k{/Control}');
    expect(screen.getAllByRole('dialog')).toHaveLength(1);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Overview' })).toHaveAttribute('aria-label', 'Overview');
  });
});
