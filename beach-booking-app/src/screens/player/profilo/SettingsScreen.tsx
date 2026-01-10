import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../../navigation/ProfilePlayerStack";
import { styles } from "../styles-player/SettingsScreen.styles";

type SettingsNavigationProp = NativeStackNavigationProp<ProfileStackParamList, "Settings">;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsNavigationProp>();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Impostazioni</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Menu Items */}
      <View style={styles.content}>
        <View style={styles.card}>
          <MenuItem
            icon="settings-outline"
            iconColor="#2196F3"
            iconBg="#E3F2FD"
            title="Preferenze"
            subtitle="Location, sport preferiti, notifiche"
            onPress={() => navigation.navigate("Preferences")}
          />
          <Divider />
          <MenuItem
            icon="lock-closed-outline"
            iconColor="#9C27B0"
            iconBg="#F3E5F5"
            title="Privacy e sicurezza"
            subtitle="Password, sicurezza account"
            onPress={() => navigation.navigate("PrivacySecurity")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  onPress,
}: {
  icon: any;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </Pressable>
  );
}

const Divider = () => <View style={styles.divider} />;
