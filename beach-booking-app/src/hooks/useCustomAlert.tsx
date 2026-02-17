import { useCallback } from 'react';
import { useAlert } from '../context/AlertContext';

/**
 * DEPRECATED: use `useAlert()` from `src/context/AlertContext` instead.
 * Backwards-compatible adapter that forwards to the global alert provider.
 */
export const useCustomAlert = () => {
  const { showAlert, hideAlert } = useAlert();

  const AlertComponent = useCallback(() => null, []);

  return { showAlert, hideAlert, AlertComponent } as const;
};