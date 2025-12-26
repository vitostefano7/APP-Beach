import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import StruttureStack from "./StruttureStack";
import BookingsStack from "./BookingsStack";
import ProfilePlayerStack from "./ProfilePlayerStack";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
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
        tabBarIcon: ({ color, focused }) => {
          let iconName: any;

          if (route.name === "Strutture")
            iconName = focused ? "business" : "business-outline";
          if (route.name === "Prenotazioni")
            iconName = focused ? "calendar" : "calendar-outline";
          if (route.name === "Profilo")
            iconName = focused ? "person" : "person-outline";

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Strutture" component={StruttureStack} />
      <Tab.Screen name="Prenotazioni" component={BookingsStack} />
      <Tab.Screen name="Profilo" component={ProfilePlayerStack} />
    </Tab.Navigator>
  );
}
