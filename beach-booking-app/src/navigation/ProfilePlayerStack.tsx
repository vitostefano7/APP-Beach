import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "../screens/ProfileScreen";
import PrivacySecurityScreen from "../screens/PrivacySecurityScreen";
import PreferencesScreen from "../screens/PreferencesScreen";

export type ProfileStackParamList = {
  Profile: undefined;
  PrivacySecurity: undefined;
  Preferences: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfilePlayerStack() {
  return (
    <Stack.Navigator 
      initialRouteName="Profile"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
    </Stack.Navigator>
  );
}