import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "../screens/player/profilo/ProfileScreen";
import PrivacySecurityScreen from "../screens/player/profilo/PrivacySecurityScreen";
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