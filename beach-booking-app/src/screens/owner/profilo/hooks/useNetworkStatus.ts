import { useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Network from "expo-network";

export const useNetworkStatus = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkNetworkStatus = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        if (isMounted) {
          setIsOffline(!networkState.isConnected);
        }
      } catch (error) {
        console.error("Error checking network status:", error);
        if (isMounted) {
          setIsOffline(true);
        }
      }
    };

    checkNetworkStatus();
    const intervalId = setInterval(checkNetworkStatus, 10000);

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        checkNetworkStatus();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      subscription.remove();
    };
  }, []);

  return isOffline;
};
