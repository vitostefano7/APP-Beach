import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import SearchScreen from "../screens/SearchScreen";
import BookingsScreen from "../screens/BookingsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import MapsStack from "./MapsStack";

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
          backgroundColor: "white"
        },

        tabBarLabelStyle: {
          fontSize: 12,
        },

        tabBarIcon: ({ color, size, focused }) => {
          let iconName: any;

          if (route.name === "Cerca") {
            iconName = focused ? "search" : "search-outline";
          }

          if (route.name === "Prenotazioni") {
            iconName = focused ? "calendar" : "calendar-outline";
          }

          if (route.name === "Mappa") {
            iconName = focused ? "map" : "map-outline";
          }

          if (route.name === "Profilo") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Cerca" component={SearchScreen} />
      <Tab.Screen name="Prenotazioni" component={BookingsScreen} />
      <Tab.Screen name="Mappa" component={MapsStack} />
      <Tab.Screen name="Profilo" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
