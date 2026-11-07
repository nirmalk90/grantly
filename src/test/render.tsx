import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { CatalogProvider } from '../state/CatalogContext';
import { AppProvider } from '../state/AppState';
import { testRepository } from './fixtures';
export function renderApp(ui: ReactElement, route = '/') {
  return render(<MemoryRouter initialEntries={[route]}><CatalogProvider repository={testRepository}><AppProvider>{ui}</AppProvider></CatalogProvider></MemoryRouter>);
}
