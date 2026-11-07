import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Modal } from './Modal';

function Harness() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open dialog</button>
      <Modal open={open} titleId="dialog-title" onClose={() => setOpen(false)}>
        <h2 id="dialog-title">Dialog title</h2>
        <input type="checkbox" aria-label="first checkbox" onChange={() => setCount((c) => c + 1)} />
        <input type="checkbox" aria-label="second checkbox" onChange={() => setCount((c) => c + 1)} />
        <span>{count}</span>
      </Modal>
    </>
  );
}

describe('Modal focus management', () => {
  it('keeps focus on the active checkbox across parent re-renders and restores focus on Escape', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Open dialog' });
    await user.click(opener);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const second = screen.getByLabelText('second checkbox');
    await user.click(second);
    expect(second).toHaveFocus();
    expect(second).toBeChecked();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
