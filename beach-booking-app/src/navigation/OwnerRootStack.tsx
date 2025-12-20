import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OwnerTabs from "./OwnerTabs";
import StrutturaDashboardScreen from "../screens/owner/StrutturaDashboardScreen";

export type OwnerRootStackParamList = {
  OwnerTabs: undefined;
  StrutturaDashboard: { strutturaId: string };
};

const Stack = createNativeStackNavigator<OwnerRootStackParamList>();

export default function OwnerRootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerTabs" component={OwnerTabs} />
      <Stack.Screen
        name="StrutturaDashboard"
        component={StrutturaDashboardScreen}
      />
    </Stack.Navigator>
  );
}
