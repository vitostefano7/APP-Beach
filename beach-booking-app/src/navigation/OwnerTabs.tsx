import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import OwnerStruttureScreen from "../screens/owner/OwnerStruttureScreen";
import OwnerBookingsScreen from "../screens/owner/OwnerBookingsScreen";
import OwnerProfileScreen from "../screens/owner/OwnerProfileScreen";

const Tab = createBottomTabNavigator();

export default function OwnerTabs() { 
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const icons: any = {
            Strutture: "business",
            Prenotazioni: "calendar",
            Profilo: "person",
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#2b8cee",
        tabBarInactiveTintColor: "#999",
      })}
    >
      <Tab.Screen name="Strutture" component={OwnerStruttureScreen} />
      <Tab.Screen name="Prenotazioni" component={OwnerBookingsScreen} />
      <Tab.Screen name="Profilo" component={OwnerProfileScreen} />
    </Tab.Navigator>
  );
}