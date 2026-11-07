import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CatalogProvider, useCatalog } from './CatalogContext';
import { testCatalog } from '../test/fixtures';
function Probe() { const { scholarships } = useCatalog(); return <p>{scholarships.length} opportunities</p>; }
describe('catalogue loading boundary', () => {
  it('shows loading, then data', async () => { render(<CatalogProvider repository={{ load: async () => testCatalog }}><Probe /></CatalogProvider>); expect(screen.getByRole('status')).toHaveTextContent('Loading'); expect(await screen.findByText('15 opportunities')).toBeInTheDocument(); });
  it('supports retry without changing saved data', async () => { const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(testCatalog); const user = userEvent.setup(); render(<CatalogProvider repository={{ load }}><Probe /></CatalogProvider>); expect(await screen.findByRole('alert')).toHaveTextContent('saved profile has not been changed'); await user.click(screen.getByRole('button', { name: 'Try again' })); expect(await screen.findByText('15 opportunities')).toBeInTheDocument(); expect(load).toHaveBeenCalledTimes(2); });
});
