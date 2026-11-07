import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { CatalogProvider } from './state/CatalogContext';
import { AppProvider, useAppActions } from './state/AppState';
import Workspace from './Workspace';
import './styles.css';
const Journey = lazy(() => import('./cinema/Journey'));
function Tour() {
  const navigate = useNavigate(); const { dispatch } = useAppActions();
  return <Journey onEnter={() => { dispatch({ type: 'see-tour' }); navigate('/', { replace: true }); }} />;
}
export default function App() {
  return <BrowserRouter><CatalogProvider><AppProvider><Routes>
    <Route path="/tour" element={<Suspense fallback={<main className="boot-fallback" role="status"><h1>Grantly</h1><p>Loading the optional tour…</p></main>}><Tour /></Suspense>} />
    <Route path="/*" element={<Workspace />} />
  </Routes></AppProvider></CatalogProvider></BrowserRouter>;
}
