import { Feather } from "@expo/vector-icons";
import {
  useGetScansByCountry,
  useGetScansByDisease,
  useGetScansSummary,
} from "@workspace/api-client-react";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const COUNTRY_NAMES: Record<string, string> = {
  ID: "Indonesia",
  MY: "Malaysia",
  TH: "Thailand",
  VN: "Vietnam",
  PH: "Philippines",
};

function StatBlock({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.statBlock,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <Text
        style={[
          styles.statBlockValue,
          { color: accent ? colors.accent : colors.primary },
        ]}
      >
        {value}
      </Text>
      <Text style={[styles.statBlockLabel, { color: colors.foreground }]}>
        {label}
      </Text>
      {sub && (
        <Text style={[styles.statBlockSub, { color: colors.mutedForeground }]}>
          {sub}
        </Text>
      )}
    </View>
  );
}

function BarRow({
  label,
  count,
  max,
  sub,
}: {
  label: string;
  count: number;
  max: number;
  sub?: string;
}) {
  const colors = useColors();
  const pct = max > 0 ? count / max : 0;

  return (
    <View style={styles.barRow}>
      <View style={styles.barMeta}>
        <Text
          style={[styles.barLabel, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {sub && (
          <Text style={[styles.barSub, { color: colors.mutedForeground }]}>
            {sub}
          </Text>
        )}
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              backgroundColor: colors.primary,
              width: `${Math.round(pct * 100)}%` as any,
              borderRadius: 4,
            },
          ]}
        />
      </View>
      <Text style={[styles.barCount, { color: colors.primary }]}>{count}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const {
    data: summary,
    isLoading: ls,
    refetch: refSum,
  } = useGetScansSummary({});
  const {
    data: byCountry,
    isLoading: lc,
    refetch: refCountry,
  } = useGetScansByCountry({});
  const {
    data: byDisease,
    isLoading: ld,
    refetch: refDisease,
  } = useGetScansByDisease({});

  const isLoading = ls || lc || ld;

  const maxCountryCount = byCountry
    ? Math.max(...byCountry.map((c) => c.count))
    : 1;
  const maxDiseaseCount = byDisease
    ? Math.max(...byDisease.map((d) => d.count))
    : 1;

  function handleRefresh() {
    refSum();
    refCountry();
    refDisease();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: topPad + 12,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Gov. Dashboard
        </Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          ASEAN disease surveillance
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginTop: 40 }}
          />
        ) : (
          <View style={styles.body}>
            {summary && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Overview
                </Text>
                <View style={styles.statsGrid}>
                  <StatBlock
                    label="Total Scans"
                    value={summary.totalScans}
                  />
                  <StatBlock
                    label="Diseases Found"
                    value={summary.diseasesDetected}
                    accent
                  />
                  <StatBlock
                    label="Countries"
                    value={summary.countriesCovered}
                  />
                  <StatBlock
                    label="Severe Cases"
                    value={summary.severeCases}
                    sub="require action"
                    accent
                  />
                  <StatBlock
                    label="Avg Confidence"
                    value={`${summary.avgConfidence.toFixed(1)}%`}
                    sub="AI accuracy"
                  />
                  <StatBlock
                    label="Analyzed Today"
                    value={summary.analyzedToday}
                  />
                </View>
              </>
            )}

            {byCountry && byCountry.length > 0 && (
              <>
                <View
                  style={[
                    styles.sectionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: colors.radius,
                    },
                  ]}
                >
                  <View style={styles.sectionCardHeader}>
                    <Feather name="globe" size={16} color={colors.primary} />
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: colors.foreground, marginBottom: 0 },
                      ]}
                    >
                      Scans by Country
                    </Text>
                  </View>
                  {byCountry.map((item) => (
                    <BarRow
                      key={item.country}
                      label={
                        COUNTRY_NAMES[item.country] ?? item.country
                      }
                      count={item.count}
                      max={maxCountryCount}
                      sub={`${item.diseaseRate}% disease rate`}
                    />
                  ))}
                </View>
              </>
            )}

            {byDisease && byDisease.length > 0 && (
              <View
                style={[
                  styles.sectionCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <View style={styles.sectionCardHeader}>
                  <Feather
                    name="alert-triangle"
                    size={16}
                    color={colors.accent}
                  />
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: colors.foreground, marginBottom: 0 },
                    ]}
                  >
                    Disease Breakdown
                  </Text>
                </View>
                {byDisease.map((item) => (
                  <BarRow
                    key={item.disease}
                    label={item.disease}
                    count={item.count}
                    max={maxDiseaseCount}
                    sub={item.cropType}
                  />
                ))}
              </View>
            )}

            {Platform.OS === "web" && <View style={{ height: 34 }} />}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  body: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  statBlock: {
    flex: 1,
    minWidth: "45%",
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
  },
  statBlockValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
  },
  statBlockLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginTop: 2,
    textAlign: "center",
  },
  statBlockSub: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    textAlign: "center",
  },
  sectionCard: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  barMeta: {
    width: 110,
  },
  barLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  barSub: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "#00000015",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
  },
  barCount: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    minWidth: 24,
    textAlign: "right",
  },
});
