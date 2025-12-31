import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AuthProvider, AuthContext } from "./src/context/AuthContext";
import { UnreadMessagesProvider } from "./src/context/UnreadMessagesContext";
import { ThemeProvider } from "./src/screens/player/profilo/ThemeContext";

import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import SetupPreferencesScreen from "./src/screens/player/profilo/SetupPreferencesScreen";

import PlayerTabs from "./src/navigation/PlayerTabs";
import OwnerRootStack from "./src/navigation/OwnerRootStack";

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { token, user, loading } = useContext(AuthContext);

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen 
            name="SetupPreferences" 
            component={SetupPreferencesScreen}
            options={{ gestureEnabled: false }}
          />
        </>
      ) : user?.role === "owner" ? (
        <Stack.Screen name="OwnerHome" component={OwnerRootStack} />
      ) : (
        <Stack.Screen name="PlayerHome" component={PlayerTabs} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UnreadMessagesProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </UnreadMessagesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}