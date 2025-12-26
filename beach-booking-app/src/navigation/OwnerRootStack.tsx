import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OwnerTabs from "./OwnerTabs";
import StrutturaDashboardScreen from "../screens/owner/StrutturaDashboardScreen";
import CreaStrutturaScreen from "../screens/owner/CreaStrutturaScreen";
import AggiungiCampoScreen from "../screens/owner/AggiungiCampoScreen";
import ModificaStrutturaScreen from "../screens/owner/struttura/ModificaStrutturaScreen";
import DettaglioCampoScreen from "../screens/owner/DettaglioCampoScreen";
import ModificaCampoScreen from "../screens/owner/ModificaCampoScreen";
import CampoDisponibilitaScreen from "../screens/owner/CampoDisponibilitaScreen";
import CampoCalendarioGestioneScreen from "../screens/owner/CampoCalendarioGestioneScreen";
import OwnerBookingsScreen from "../screens/owner/OwnerBookingsScreen";
import DettaglioPrenotazioneOwnerScreen from "../screens/owner/DettaglioPrenotazioneOwnerScreen";
import InserisciRisultatoScreen from "../screens/InserisciRisultatoScreen";


export type OwnerRootStackParamList = {
  OwnerTabs: undefined;
  StrutturaDashboard: { strutturaId: string };
  CreaStruttura: undefined;
  AggiungiCampo: { strutturaId: string };
  ModificaStruttura: { strutturaId: string };
  DettaglioCampo: { campoId: string };
  ModificaCampo: { campoId: string };
};

const Stack = createNativeStackNavigator<OwnerRootStackParamList>();

export default function OwnerRootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerTabs" component={OwnerTabs} />
      <Stack.Screen
        name="StrutturaDashboard"
        component={StrutturaDashboardScreen}
      />
      <Stack.Screen
        name="CreaStruttura"
        component={CreaStrutturaScreen}
      />
      <Stack.Screen
        name="AggiungiCampo"
        component={AggiungiCampoScreen}
      />
      <Stack.Screen
        name="ModificaStruttura"
        component={ModificaStrutturaScreen}
      />
      <Stack.Screen
        name="OwnerBookings"
        component={OwnerBookingsScreen}
      />
      <Stack.Screen
        name="DettaglioCampo"
        component={DettaglioCampoScreen}
      />
      <Stack.Screen
        name="ModificaCampo"
        component={ModificaCampoScreen}
      />
      <Stack.Screen
        name="CampoDisponibilita"
        component={CampoDisponibilitaScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="CampoCalendarioGestione" 
        component={CampoCalendarioGestioneScreen} 
      />
      <Stack.Screen 
        name="OwnerDettaglioPrenotazione" 
        component={DettaglioPrenotazioneOwnerScreen} 
      />
      <Stack.Screen 
        name="InserisciRisultato" 
        component={InserisciRisultatoScreen} 
      />
    </Stack.Navigator>
  );
}