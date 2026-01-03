import { createNativeStackNavigator } from "@react-navigation/native-stack";
import StruttureScreen from "../screens/StruttureScreen";
import FieldDetailsScreen from "../screens/player/struttura/FieldDetailsScreen/FieldDetailsScreen"
import ConfermaPrenotazioneScreen from "../screens/ConfermaPrenotazioneScreen";
import LeMiePrenotazioniScreen from "../screens/LeMiePrenotazioneScreen";
import DettaglioPrenotazioneScreen from "../screens/DettaglioPrenotazioneScreen";
import ChatScreen from "../screens/player/comunicazioni/ChatScreen";
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
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }}/>
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
