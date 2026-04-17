import { Feather } from "@expo/vector-icons";
import {
  useGetRecentScans,
  useGetScansSummary,
} from "@workspace/api-client-react";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScanCard } from "@/components/ScanCard";
import { useColors } from "@/hooks/useColors";

function StatChip({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.statChip,
        { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: colors.radius },
      ]}
    >
      <Feather name={icon as any} size={16} color="#ffffff" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: summary, isLoading: loadingSum, refetch: refetchSum } = useGetScansSummary({});
  const { data: recentScans, isLoading: loadingScans, refetch: refetchScans } = useGetRecentScans({});

  const isLoading = loadingSum || loadingScans;

  function handleRefresh() {
    refetchSum();
    refetchScans();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[colors.primary, colors.primary + "cc"]}
          style={[styles.hero, { paddingTop: topPad + 20 }]}
        >
          <View style={styles.heroContent}>
            <Image
              source={require("../../assets/images/icon.png")}
              style={styles.heroLogo}
              resizeMode="contain"
            />
            <Text style={styles.heroTitle}>Rice Doctor AI</Text>
            <Text style={styles.heroSub}>
              ASEAN Rice Disease Detection Platform
            </Text>
          </View>

          {loadingSum ? (
            <ActivityIndicator color="#ffffff" style={{ marginVertical: 20 }} />
          ) : summary ? (
            <View style={styles.statsRow}>
              <StatChip
                icon="activity"
                value={summary.totalScans}
                label="Total Scans"
              />
              <StatChip
                icon="alert-triangle"
                value={summary.diseasesDetected}
                label="Diseases"
              />
              <StatChip
                icon="globe"
                value={summary.countriesCovered}
                label="Countries"
              />
              <StatChip
                icon="percent"
                value={`${summary.avgConfidence.toFixed(0)}%`}
                label="Avg Conf."
              />
            </View>
          ) : null}
        </LinearGradient>

        <View
          style={[styles.body, { backgroundColor: colors.background }]}
        >
          {summary && summary.severeCases > 0 && (
            <View
              style={[
                styles.alertBanner,
                {
                  backgroundColor: colors.destructive + "15",
                  borderColor: colors.destructive + "40",
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Feather name="alert-circle" size={16} color={colors.destructive} />
              <Text
                style={[styles.alertText, { color: colors.destructive }]}
              >
                {summary.severeCases} severe case
                {summary.severeCases !== 1 ? "s" : ""} require immediate attention
              </Text>
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Recent Scans
          </Text>

          {loadingScans ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: 20 }}
            />
          ) : recentScans && recentScans.length > 0 ? (
            recentScans.map((scan) => (
              <ScanCard
                key={scan.id}
                id={scan.id}
                cropType={scan.cropType}
                country={scan.country}
                region={scan.region}
                detectedDisease={scan.detectedDisease}
                severity={scan.severity}
                diseaseConfidence={scan.diseaseConfidence}
                status={scan.status}
                createdAt={scan.createdAt}
              />
            ))
          ) : (
            <View style={styles.empty}>
              <Feather name="inbox" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No scans yet. Use the Scan tab to analyze your crops.
              </Text>
            </View>
          )}

          {Platform.OS === "web" && <View style={{ height: 34 }} />}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  heroContent: {
    marginBottom: 20,
    alignItems: "flex-start",
  },
  heroLogo: {
    width: 52,
    height: 52,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  statChip: {
    flex: 1,
    minWidth: 70,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 3,
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },
  body: {
    padding: 16,
    gap: 0,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  alertText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 20,
  },
});
