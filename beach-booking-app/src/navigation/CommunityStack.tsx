import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DashboardStack from "./DashboardStack";
import StruttureStack from "./StruttureStack";
import BookingsStack from "./BookingsStack";
import ProfilePlayerStack from "./ProfilePlayerStack";
import CommunityScreen from "../screens/player/dashboard/CommunityScreen";
import CreatePostScreen from "../screens/player/dashboard/CreatePostScreen";
import PostDetailScreen from "../screens/player/dashboard/PostDetailScreen";
import CercaAmiciScreen from "../screens/player/dashboard/CercaAmiciScreen"; 
import FieldDetailsScreen from "../screens/player/struttura/FieldDetailsScreen/FieldDetailsScreen";
import UserProfileScreen from "../screens/player/profilo/UserProfileScreen";

export type CommunityStackParamList = {
  DashboardRoot: undefined;
  StruttureRoot: undefined;
  PrenotazioniRoot: undefined;
  ProfiloRoot: undefined;
  Community: undefined;
  CreatePost: undefined;
  PostDetail: { postId: string };
  CercaAmici: undefined;
  DettaglioStruttura: { strutturaId?: string; struttura?: any };
  ProfiloUtente: { userId: string };
};

const Stack = createNativeStackNavigator<CommunityStackParamList>();

export default function CommunityStack() {
  return (
    <Stack.Navigator initialRouteName="Community">
      <Stack.Screen
        name="DashboardRoot"
        component={DashboardStack}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="StruttureRoot"
        component={StruttureStack}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PrenotazioniRoot"
        component={BookingsStack}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfiloRoot"
        component={ProfilePlayerStack}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="DettaglioStruttura"
        component={FieldDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfiloUtente"
        component={UserProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CercaAmici"
        component={CercaAmiciScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Community"
        component={CommunityScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
