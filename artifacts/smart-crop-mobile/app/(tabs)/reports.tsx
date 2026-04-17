import { Feather } from "@expo/vector-icons";
import { useListReports } from "@workspace/api-client-react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

type Report = {
  id: number;
  title: string;
  country: string;
  region: string;
  reportType: string;
  summary: string;
  totalFarmsInspected: number;
  diseaseCasesFound: number;
  affectedAreaHectares: number;
  riskLevel: string;
  recommendations?: string | null;
  createdAt: string;
  createdBy?: string | null;
};

const COUNTRY_NAMES: Record<string, string> = {
  ID: "Indonesia",
  MY: "Malaysia",
  TH: "Thailand",
  VN: "Vietnam",
  PH: "Philippines",
};

const RISK_COLORS: Record<string, string> = {
  low: "#22c55e",
  medium: "#f59f0a",
  high: "#f97316",
  critical: "#ef4444",
};

const REPORT_TYPE_LABELS: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  outbreak_alert: "Outbreak Alert",
  survey: "Survey",
};

function RiskBadge({ level }: { level: string }) {
  const color = RISK_COLORS[level] ?? "#6b7280";
  return (
    <View
      style={[
        styles.riskBadge,
        { backgroundColor: color + "20", borderColor: color + "40" },
      ]}
    >
      <View style={[styles.riskDot, { backgroundColor: color }]} />
      <Text style={[styles.riskText, { color }]}>
        {level.toUpperCase()}
      </Text>
    </View>
  );
}

function ReportDetail({ report, onClose }: { report: Report; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.detailContainer, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.detailHeader,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 12,
          },
        ]}
      >
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.detailTitle, { color: colors.foreground }]} numberOfLines={2}>
            {report.title}
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={styles.detailMeta}>
          <RiskBadge level={report.riskLevel} />
          <Text style={[styles.detailMetaText, { color: colors.mutedForeground }]}>
            {REPORT_TYPE_LABELS[report.reportType] ?? report.reportType} ·{" "}
            {COUNTRY_NAMES[report.country] ?? report.country}, {report.region}
          </Text>
        </View>

        <View
          style={[
            styles.statsRow,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {report.totalFarmsInspected}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Farms Inspected
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.accent }]}>
              {report.diseaseCasesFound}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Disease Cases
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {report.affectedAreaHectares.toFixed(0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Hectares
            </Text>
          </View>
        </View>

        <View>
          <Text style={[styles.subheading, { color: colors.foreground }]}>Summary</Text>
          <Text style={[styles.bodyText, { color: colors.foreground }]}>{report.summary}</Text>
        </View>

        {report.recommendations && (
          <View
            style={[
              styles.recBox,
              {
                backgroundColor: colors.primary + "10",
                borderColor: colors.primary + "30",
                borderRadius: colors.radius,
              },
            ]}
          >
            <View style={styles.recHeader}>
              <Feather name="check-circle" size={16} color={colors.primary} />
              <Text style={[styles.subheading, { color: colors.primary, marginBottom: 0 }]}>
                Recommendations
              </Text>
            </View>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>
              {report.recommendations}
            </Text>
          </View>
        )}

        {report.createdBy && (
          <Text style={[styles.createdBy, { color: colors.mutedForeground }]}>
            Prepared by: {report.createdBy}
          </Text>
        )}

        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>
    </View>
  );
}

export default function ReportsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data: reports, isLoading, refetch } = useListReports({});
  const [selected, setSelected] = useState<Report | null>(null);

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
          Reports
        </Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          Government monitoring
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : reports && reports.length > 0 ? (
          <View style={styles.list}>
            {reports.map((report) => {
              const riskColor = RISK_COLORS[report.riskLevel] ?? "#6b7280";
              const date = new Date(report.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <TouchableOpacity
                  key={report.id}
                  style={[
                    styles.reportCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: colors.radius,
                      borderLeftColor: riskColor,
                    },
                  ]}
                  onPress={() => setSelected(report)}
                  activeOpacity={0.75}
                >
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
                        {report.title}
                      </Text>
                      <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
                        {COUNTRY_NAMES[report.country] ?? report.country} · {report.region} · {date}
                      </Text>
                    </View>
                    <RiskBadge level={report.riskLevel} />
                  </View>
                  <Text style={[styles.cardSummary, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {report.summary}
                  </Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.footerStat}>
                      <Feather name="home" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.footerStatText, { color: colors.mutedForeground }]}>
                        {report.totalFarmsInspected} farms
                      </Text>
                    </View>
                    <View style={styles.footerStat}>
                      <Feather name="alert-circle" size={12} color={colors.accent} />
                      <Text style={[styles.footerStatText, { color: colors.accent }]}>
                        {report.diseaseCasesFound} cases
                      </Text>
                    </View>
                    <View style={styles.footerStat}>
                      <Feather name="map" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.footerStatText, { color: colors.mutedForeground }]}>
                        {report.affectedAreaHectares.toFixed(0)} ha
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.empty}>
            <Feather name="file-text" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No reports available
            </Text>
          </View>
        )}

        {Platform.OS === "web" && <View style={{ height: 34 }} />}
      </ScrollView>

      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(null)}
      >
        {selected && (
          <ReportDetail report={selected} onClose={() => setSelected(null)} />
        )}
      </Modal>
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
  list: {
    padding: 16,
    gap: 12,
  },
  reportCard: {
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 14,
    gap: 8,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
  },
  cardMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  cardSummary: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  footerStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerStatText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  riskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  riskText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  detailContainer: { flex: 1 },
  detailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  detailTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    lineHeight: 22,
  },
  detailMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailMetaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    borderWidth: 1,
    overflow: "hidden",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
  },
  statDivider: {
    width: 1,
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    textAlign: "center",
  },
  subheading: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  recBox: {
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  recHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  createdBy: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
});
