import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import SetupPreferencesScreen from '../screens/player/profilo/SetupPreferencesScreen';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
      />
      
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
      />
      
      <Stack.Screen 
        name="SetupPreferences" 
        component={SetupPreferencesScreen}
        options={{
          // Previene il ritorno indietro con gesture
          gestureEnabled: false,
        }}
      />
    </Stack.Navigator>
  );
}