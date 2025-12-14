import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MapsScreen from "../screens/MapsScreen";
import FieldDetailsScreen from "../screens/FieldDetailsScreen";

const Stack = createNativeStackNavigator();

export default function MapsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Maps"
        component={MapsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FieldDetails"
        component={FieldDetailsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
