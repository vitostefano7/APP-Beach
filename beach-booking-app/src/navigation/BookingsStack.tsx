import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LeMiePrenotazioniScreen from "../screens/LeMiePrenotazioneScreen";
import DettaglioPrenotazioneScreen from "../screens/DettaglioPrenotazioneScreen";
import InserisciRisultatoScreen from "../screens/InserisciRisultatoScreen";

const Stack = createNativeStackNavigator();

export default function BookingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="LeMiePrenotazioni"
        component={LeMiePrenotazioniScreen}
      />
      <Stack.Screen
        name="DettaglioPrenotazione"
        component={DettaglioPrenotazioneScreen}
      />
      <Stack.Screen
        name="InserisciRisultato"
        component={InserisciRisultatoScreen}
      />
    </Stack.Navigator>
  );
}