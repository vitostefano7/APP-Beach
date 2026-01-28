import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "../screens/player/profilo/ProfileScreen";
import FriendsListScreen from "../screens/player/profilo/FriendsListScreen";
import PrivacySecurityScreen from "../screens/player/profilo/PrivacySecurityScreen";
import PreferencesScreen from "../screens/PreferencesScreen";
import SettingsScreen from "../screens/player/profilo/SettingsScreen";
import ConversazioneScreen from "../screens/player/comunicazioni/ConversazioneScreen";
import ChatScreen from "../screens/player/comunicazioni/ChatScreen";
import GroupChatScreen from "../screens/player/comunicazioni/GroupChatScreen";
import DettaglioPrenotazioneScreen from "../screens/player/prenotazioni/DettaglioPrenotazioneScreen";
import FieldDetailsScreen from "../screens/player/struttura/FieldDetailsScreen/FieldDetailsScreen";
import UserProfileScreen from "../screens/player/profilo/UserProfileScreen";

export type ProfileStackParamList = {
  Profile: undefined;
  FriendsList: { userId?: string; filter?: "followers" | "following" | "all" } | undefined;
  Settings: undefined;
  PrivacySecurity: undefined;
  Preferences: undefined;
  Conversazione: undefined;
  Chat: { conversationId: string };
  GroupChat: { groupId: string };
  DettaglioPrenotazione: { bookingId: string };
  FieldDetails: { fieldId: string };
  ProfiloUtente: { userId: string };
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfilePlayerStack() {
  return (
    // @ts-ignore
    <Stack.Navigator
      initialRouteName="Profile"
      screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="FriendsList" component={FriendsListScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen name="Conversazione" component={ConversazioneScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="GroupChat" component={GroupChatScreen} />
      <Stack.Screen name="DettaglioPrenotazione" component={DettaglioPrenotazioneScreen} />
      <Stack.Screen name="FieldDetails" component={FieldDetailsScreen} />
      <Stack.Screen name="ProfiloUtente" component={UserProfileScreen} />
    </Stack.Navigator>
  );
}
