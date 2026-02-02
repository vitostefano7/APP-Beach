import { useState, useCallback } from 'react';
import CustomAlert from '../components/CustomAlert';
import type { AlertConfig } from '../components/CustomAlert';

export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [visible, setVisible] = useState(false);

  const showAlert = useCallback((config: AlertConfig) => {
    setAlertConfig(config);
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
    setAlertConfig(null);
  }, []);

  const AlertComponent = useCallback(() => (
    <CustomAlert
      visible={visible}
      config={alertConfig}
      onClose={hideAlert}
    />
  ), [visible, alertConfig, hideAlert]);

  return {
    showAlert,
    AlertComponent,
  };
};