import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MapsScreen from "../screens/MapsScreen";
import FieldDetailsScreen from "../screens/FieldDetailsScreen";
import Det

const Stack = createNativeStackNavigator();

export default function MapsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Maps"
        component={MapsScreen}
        options={{
          title: "Mappa",
          headerBackVisible: false,
        }}
      />

      <Stack.Screen
        name="FieldDetails"
        component={FieldDetailsScreen}
        options={{
          title: "Dettagli campo",
        }}
      />
    </Stack.Navigator>
  );
}