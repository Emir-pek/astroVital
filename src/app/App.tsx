import { useState } from 'react';
import { RouterProvider } from 'react-router';
import { AppProviders } from './providers/AppProviders';
import { createAppRouter } from './router';

export function App() {
  // Created once per App mount (keeps tests isolated, avoids module-level side effects).
  const [router] = useState(createAppRouter);
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
