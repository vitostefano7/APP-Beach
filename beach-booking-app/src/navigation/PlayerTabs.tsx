import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import StruttureStack from "./StruttureStack";
import BookingsStack from "./BookingsStack";
import ProfilePlayerStack from "./ProfilePlayerStack"; // ✅ Importato ProfilePlayerStack

const Tab = createBottomTabNavigator();

export default function PlayerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#2979ff",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 6,
          backgroundColor: "white",
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: any;

          if (route.name === "StruttureTab")
            iconName = focused ? "business" : "business-outline";
          if (route.name === "Prenotazioni")
            iconName = focused ? "calendar" : "calendar-outline";
          if (route.name === "Profilo")
            iconName = focused ? "person" : "person-outline";

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="StruttureTab" 
        component={StruttureStack} 
        options={{ tabBarLabel: "Strutture" }} 
      />
      <Tab.Screen 
        name="Prenotazioni" 
        component={BookingsStack}
      />
      <Tab.Screen 
        name="Profilo" 
        component={ProfilePlayerStack} // ✅ Ora usa ProfilePlayerStack invece di ProfileScreen
      />
    </Tab.Navigator>
  );
}