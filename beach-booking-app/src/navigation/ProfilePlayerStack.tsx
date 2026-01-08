import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "../screens/player/profilo/ProfileScreen";
import FriendsListScreen from "../screens/player/profilo/FriendsListScreen";
import PrivacySecurityScreen from "../screens/player/profilo/PrivacySecurityScreen";
import PreferencesScreen from "../screens/PreferencesScreen";
import ConversazioneScreen from "../screens/player/comunicazioni/ConversazioneScreen";
import ChatScreen from "../screens/player/comunicazioni/ChatScreen";
import GroupChatScreen from "../screens/player/comunicazioni/GroupChatScreen";

export type ProfileStackParamList = {
  Profile: undefined;
  FriendsList: { filter?: "followers" | "following" } | undefined;
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
    <Stack.Screen name="FriendsList" component={FriendsListScreen} />
    <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen name="Conversazione" component={ConversazioneScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="GroupChat" component={GroupChatScreen} />
    </Stack.Navigator>
  );
}
