import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function OwnerProfileSkeleton() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.avatar} />
            <View style={styles.headerInfo}>
              <View style={[styles.skeletonLine, { width: "60%", marginBottom: 8 }]} />
              <View style={[styles.skeletonLine, { width: "80%", marginBottom: 12 }]} />
              <View style={[styles.skeletonLine, { width: "30%" }]} />
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.statCard}>
              <View style={styles.statIcon} />
              <View style={[styles.skeletonLine, { width: "40%", marginBottom: 4 }]} />
              <View style={[styles.skeletonLine, { width: "60%" }]} />
            </View>
          ))}
        </View>

        {[1, 2, 3].map((section) => (
          <View key={section} style={styles.section}>
            <View style={[styles.skeletonLine, { width: "40%", marginBottom: 16 }]} />
            {[1, 2, 3].map((item) => (
              <View key={item} style={styles.menuCard}>
                <View style={styles.menuLeft}>
                  <View style={styles.menuIcon} />
                  <View style={styles.menuText}>
                    <View style={[styles.skeletonLine, { width: "70%", marginBottom: 4 }]} />
                    <View style={[styles.skeletonLine, { width: "50%" }]} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    padding: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#e0e0e0",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: "#e0e0e0",
    borderRadius: 6,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
    backgroundColor: "#e0e0e0",
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  menuCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#e0e0e0",
  },
  menuText: {
    flex: 1,
    marginLeft: 12,
  },
});
