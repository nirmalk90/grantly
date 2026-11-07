import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Grantly render failure', error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="boot-fallback" role="alert">
          <h1>Something went wrong</h1>
          <p>Grantly could not render this view. Your saved data remains in this browser.</p>
          <button type="button" onClick={() => window.location.reload()}>Reload app</button>
        </div>
      );
    }
    return this.props.children;
  }
}
