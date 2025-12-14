import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import SearchScreen from "../screens/SearchScreen";
import BookingsScreen from "../screens/BookingsScreen";
import MapsScreen from "../screens/MapsScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function PlayerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const icons: any = {
            Cerca: "search",
            Prenotazioni: "calendar",
            Mappa: "map",
            Profilo: "person",
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#2b8cee",
        tabBarInactiveTintColor: "#999",
      })}
    >
      <Tab.Screen name="Cerca" component={SearchScreen} />
      <Tab.Screen name="Prenotazioni" component={BookingsScreen} />
      <Tab.Screen name="Mappa" component={MapsScreen} />
      <Tab.Screen name="Profilo" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
