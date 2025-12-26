import { createNativeStackNavigator } from "@react-navigation/native-stack";
import StruttureScreen from "../screens/StruttureScreen";
import FieldDetailsScreen from "../screens/FieldDetailsScreen";
import ConfermaPrenotazioneScreen from "../screens/ConfermaPrenotazioneScreen";
import LeMiePrenotazioniScreen from "../screens/LeMiePrenotazioneScreen";
import DettaglioPrenotazioneScreen from "../screens/DettaglioPrenotazioneScreen";
const Stack = createNativeStackNavigator();

export default function StruttureStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Strutture"
        component={StruttureScreen}
        options={{headerShown: false}}

      />
      <Stack.Screen name="ConfermaPrenotazione" component={ConfermaPrenotazioneScreen} />
      <Stack.Screen name="LeMiePrenotazioni" component={LeMiePrenotazioniScreen} />
      <Stack.Screen
        name="DettaglioPrenotazione"
        component={DettaglioPrenotazioneScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FieldDetails"
        component={FieldDetailsScreen}
        options={{
          headerShown: true,
          title: "Dettagli campo",
          headerBackTitle: "Indietro",
        }}
      />
    </Stack.Navigator>
  );
}
