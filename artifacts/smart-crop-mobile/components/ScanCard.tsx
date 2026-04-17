import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface ScanCardProps {
  id: number;
  cropType: string;
  country: string;
  region: string;
  detectedDisease?: string | null;
  severity?: string | null;
  diseaseConfidence?: number | null;
  status: string;
  createdAt: string;
}

const COUNTRY_NAMES: Record<string, string> = {
  ID: "Indonesia",
  MY: "Malaysia",
  TH: "Thailand",
  VN: "Vietnam",
  PH: "Philippines",
};

const CROP_LABELS: Record<string, string> = {
  rice: "Rice",
  oil_palm: "Oil Palm",
  corn: "Corn",
  cassava: "Cassava",
};

export function ScanCard({
  id,
  cropType,
  country,
  region,
  detectedDisease,
  severity,
  diseaseConfidence,
  status,
  createdAt,
}: ScanCardProps) {
  const colors = useColors();

  const severityColor =
    severity === "severe"
      ? colors.destructive
      : severity === "moderate"
        ? colors.accent
        : colors.primary;

  const date = new Date(createdAt);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
      onPress={() => router.push(`/scan-detail/${id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.cropIcon,
            { backgroundColor: colors.secondary, borderRadius: colors.radius },
          ]}
        >
          <Feather name="activity" size={18} color={colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.cropLabel, { color: colors.foreground }]}>
            {CROP_LABELS[cropType] ?? cropType}
          </Text>
          <Text style={[styles.location, { color: colors.mutedForeground }]}>
            {region}, {COUNTRY_NAMES[country] ?? country}
          </Text>
        </View>
        <View style={styles.meta}>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {dateStr}
          </Text>
          {severity && (
            <View
              style={[
                styles.badge,
                { backgroundColor: severityColor + "20", borderRadius: 4 },
              ]}
            >
              <Text style={[styles.badgeText, { color: severityColor }]}>
                {severity}
              </Text>
            </View>
          )}
        </View>
      </View>
      {detectedDisease && (
        <View style={styles.diseaseRow}>
          <Feather name="alert-circle" size={12} color={severityColor} />
          <Text
            style={[styles.disease, { color: severityColor }]}
            numberOfLines={1}
          >
            {detectedDisease}
            {diseaseConfidence ? ` · ${diseaseConfidence}%` : ""}
          </Text>
        </View>
      )}
      {status === "pending" && (
        <View style={styles.diseaseRow}>
          <Feather name="clock" size={12} color={colors.mutedForeground} />
          <Text style={[styles.disease, { color: colors.mutedForeground }]}>
            Analysis pending
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cropIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  cropLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  location: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  meta: {
    alignItems: "flex-end",
    gap: 4,
  },
  date: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
  },
  diseaseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  disease: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
});
