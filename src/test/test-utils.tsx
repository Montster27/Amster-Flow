import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { GuideProvider } from '../contexts/GuideContext';
import { SectorMapProvider } from '../contexts/SectorMapContext';
import { DiscoveryProvider } from '../contexts/DiscoveryContext';
import { PivotProvider } from '../contexts/PivotContext';

/**
 * Custom render function that wraps components with all providers
 * This ensures tests run with the same context as the real app
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add any custom options here
  initialRoute?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { initialRoute = '/', ...renderOptions } = options || {};

  // Set initial route if specified
  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <AuthProvider>
          <GuideProvider>
            <SectorMapProvider>
              <DiscoveryProvider>
                <PivotProvider>{children}</PivotProvider>
              </DiscoveryProvider>
            </SectorMapProvider>
          </GuideProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Export custom render as default
export { renderWithProviders as render };
