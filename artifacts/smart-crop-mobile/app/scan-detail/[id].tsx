import { Feather } from "@expo/vector-icons";
import {
  useCreateRecommendation,
  useGetScan,
  useGetVoiceGuidance,
  useListRecommendations,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const SEVERITY_COLORS: Record<string, string> = {
  mild: "#22c55e",
  moderate: "#f59f0a",
  severe: "#ef4444",
};

const LANGUAGES = [
  { code: "id", label: "Bahasa Indonesia" },
  { code: "jv", label: "Basa Jawa" },
  { code: "en", label: "English" },
  { code: "th", label: "Thai" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "ph", label: "Filipino" },
  { code: "su", label: "Basa Sunda" },
];

const COUNTRY_NAMES: Record<string, string> = {
  ID: "Indonesia",
  MY: "Malaysia",
  TH: "Thailand",
  VN: "Vietnam",
  PH: "Philippines",
};

export default function ScanDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scanId = parseInt(id ?? "0", 10);

  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [selectedLang, setSelectedLang] = useState("id");
  const [voiceText, setVoiceText] = useState<string | null>(null);

  const { data: scan, isLoading: scanLoading } = useGetScan(scanId);
  const { data: recommendations, isLoading: recLoading } = useListRecommendations(
    { scanId },
  );

  const { mutate: createRec, isPending: creatingRec } = useCreateRecommendation({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
    },
  });

  const { mutate: getVoice, isPending: voiceLoading } = useGetVoiceGuidance({
    mutation: {
      onSuccess: (data) => {
        setVoiceText(data.text);
        setShowVoiceModal(true);
      },
    },
  });

  const recommendation = recommendations?.[0];

  function handleGetRecommendation() {
    if (!scan) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createRec({
      data: { scanId: scan.id, country: scan.country },
    });
  }

  function handleVoiceGuidance(lang: string) {
    if (!scan?.detectedDisease || !scan?.treatmentSuggestion) return;
    setSelectedLang(lang);
    setVoiceText(null);
    getVoice({
      data: {
        disease: scan.detectedDisease,
        treatment: scan.treatmentSuggestion,
        language: lang,
        cropType: scan.cropType,
      },
    });
  }

  const severityColor = scan?.severity
    ? SEVERITY_COLORS[scan.severity] ?? colors.primary
    : colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 12,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Scan Result
        </Text>
        <View style={{ width: 22 }} />
      </View>

      {scanLoading ? (
        <ActivityIndicator
          color={colors.primary}
          style={{ marginTop: 40 }}
        />
      ) : !scan ? (
        <View style={styles.errorState}>
          <Feather name="x-circle" size={32} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.foreground }]}>
            Scan not found
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.body}>
            <View
              style={[
                styles.diseaseCard,
                {
                  backgroundColor: severityColor + "10",
                  borderColor: severityColor + "40",
                  borderRadius: colors.radius,
                },
              ]}
            >
              <View style={styles.diseaseHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.diseaseLabel, { color: colors.mutedForeground }]}>
                    DETECTED DISEASE
                  </Text>
                  <Text style={[styles.diseaseName, { color: colors.foreground }]}>
                    {scan.detectedDisease ?? "No disease detected"}
                  </Text>
                </View>
                {scan.severity && (
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: severityColor, borderRadius: colors.radius / 2 },
                    ]}
                  >
                    <Text style={styles.severityText}>
                      {scan.severity.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.confRow}>
                <Feather name="bar-chart-2" size={14} color={severityColor} />
                <Text style={[styles.confText, { color: severityColor }]}>
                  {scan.diseaseConfidence ?? 0}% confidence
                </Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Crop</Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>
                    {scan.cropType.replace("_", " ")}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Country</Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>
                    {COUNTRY_NAMES[scan.country] ?? scan.country}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Region</Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={1}>
                    {scan.region}
                  </Text>
                </View>
              </View>
            </View>

            {scan.aiAnalysis && (
              <View
                style={[
                  styles.section,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <Feather name="cpu" size={16} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    AI Analysis
                  </Text>
                </View>
                <Text style={[styles.sectionBody, { color: colors.foreground }]}>
                  {scan.aiAnalysis}
                </Text>
              </View>
            )}

            {scan.treatmentSuggestion && (
              <View
                style={[
                  styles.section,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <Feather name="thermometer" size={16} color={colors.accent} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    Treatment Plan
                  </Text>
                </View>
                <Text style={[styles.sectionBody, { color: colors.foreground }]}>
                  {scan.treatmentSuggestion}
                </Text>
              </View>
            )}

            {!recommendation && !recLoading && scan.detectedDisease && (
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: colors.radius,
                  },
                ]}
                onPress={handleGetRecommendation}
                disabled={creatingRec}
                activeOpacity={0.85}
              >
                {creatingRec ? (
                  <View style={styles.btnInner}>
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text style={styles.actionBtnText}>Getting recommendations...</Text>
                  </View>
                ) : (
                  <View style={styles.btnInner}>
                    <Feather name="package" size={16} color="#ffffff" />
                    <Text style={styles.actionBtnText}>
                      Get Fertilizer Recommendation
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {recLoading && (
              <ActivityIndicator color={colors.primary} />
            )}

            {recommendation && (
              <View
                style={[
                  styles.section,
                  {
                    backgroundColor: colors.primary + "08",
                    borderColor: colors.primary + "30",
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <Feather name="package" size={16} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    Fertilizer Recommendation
                  </Text>
                </View>

                <View
                  style={[
                    styles.fertCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: colors.radius,
                    },
                  ]}
                >
                  <Text style={[styles.fertName, { color: colors.primary }]}>
                    {recommendation.fertilizerName}
                  </Text>
                  <View style={styles.fertMeta}>
                    <View
                      style={[
                        styles.fertTypeBadge,
                        {
                          backgroundColor: colors.secondary,
                          borderRadius: 4,
                        },
                      ]}
                    >
                      <Text style={[styles.fertTypeText, { color: colors.primary }]}>
                        {recommendation.fertilizerType}
                      </Text>
                    </View>
                    {recommendation.subsidized && (
                      <View
                        style={[
                          styles.fertTypeBadge,
                          { backgroundColor: colors.accent + "20", borderRadius: 4 },
                        ]}
                      >
                        <Text style={[styles.fertTypeText, { color: colors.accent }]}>
                          Subsidized
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.fertDetail}>
                  <Text style={[styles.fertDetailLabel, { color: colors.mutedForeground }]}>
                    Dosage
                  </Text>
                  <Text style={[styles.fertDetailValue, { color: colors.foreground }]}>
                    {recommendation.dosage}
                  </Text>
                </View>
                <View style={styles.fertDetail}>
                  <Text style={[styles.fertDetailLabel, { color: colors.mutedForeground }]}>
                    Application
                  </Text>
                  <Text style={[styles.fertDetailValue, { color: colors.foreground }]}>
                    {recommendation.applicationMethod}
                  </Text>
                </View>
                {recommendation.localAvailability && (
                  <View style={styles.fertDetail}>
                    <Feather name="map-pin" size={13} color={colors.primary} />
                    <Text style={[styles.fertDetailValue, { color: colors.primary }]}>
                      {recommendation.localAvailability}
                    </Text>
                  </View>
                )}

                {recommendation.aiGuidance && (
                  <Text
                    style={[styles.fertGuidance, { color: colors.foreground }]}
                  >
                    {recommendation.aiGuidance}
                  </Text>
                )}
              </View>
            )}

            {scan.detectedDisease && scan.treatmentSuggestion && (
              <>
                <Text style={[styles.voiceTitle, { color: colors.foreground }]}>
                  Voice Guidance Language
                </Text>
                <View style={styles.langGrid}>
                  {LANGUAGES.map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.langChip,
                        {
                          backgroundColor:
                            selectedLang === lang.code
                              ? colors.primary
                              : colors.card,
                          borderColor:
                            selectedLang === lang.code
                              ? colors.primary
                              : colors.border,
                          borderRadius: colors.radius,
                        },
                      ]}
                      onPress={() => {
                        setSelectedLang(lang.code);
                        Haptics.selectionAsync();
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.langText,
                          {
                            color:
                              selectedLang === lang.code
                                ? "#ffffff"
                                : colors.foreground,
                          },
                        ]}
                      >
                        {lang.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: colors.accent,
                      borderRadius: colors.radius,
                    },
                  ]}
                  onPress={() => handleVoiceGuidance(selectedLang)}
                  disabled={voiceLoading}
                  activeOpacity={0.85}
                >
                  {voiceLoading ? (
                    <View style={styles.btnInner}>
                      <ActivityIndicator color="#ffffff" size="small" />
                      <Text style={styles.actionBtnText}>Generating...</Text>
                    </View>
                  ) : (
                    <View style={styles.btnInner}>
                      <Feather name="mic" size={16} color="#ffffff" />
                      <Text style={styles.actionBtnText}>
                        Get Voice Guidance
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}

            {Platform.OS === "web" ? (
              <View style={{ height: 34 }} />
            ) : (
              <View style={{ height: insets.bottom + 20 }} />
            )}
          </View>
        </ScrollView>
      )}

      <Modal
        visible={showVoiceModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowVoiceModal(false)}
      >
        <VoiceGuidanceSheet
          text={voiceText}
          lang={LANGUAGES.find((l) => l.code === selectedLang)?.label ?? selectedLang}
          onClose={() => setShowVoiceModal(false)}
        />
      </Modal>
    </View>
  );
}

function VoiceGuidanceSheet({
  text,
  lang,
  onClose,
}: {
  text: string | null;
  lang: string;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.voiceSheet, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.voiceSheetHeader,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 12,
          },
        ]}
      >
        <View style={styles.btnInner}>
          <Feather name="mic" size={18} color={colors.primary} />
          <Text style={[styles.voiceSheetTitle, { color: colors.foreground }]}>
            Voice Guidance · {lang}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
      >
        {text ? (
          <Text style={[styles.voiceText, { color: colors.foreground }]}>
            {text}
          </Text>
        ) : (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        )}
        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  body: {
    padding: 16,
    gap: 12,
  },
  diseaseCard: {
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  diseaseHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  diseaseLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
  diseaseName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
    lineHeight: 24,
    marginTop: 4,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  severityText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  confRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  confText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  infoRow: {
    flexDirection: "row",
    gap: 16,
    paddingTop: 4,
  },
  infoItem: { flex: 1 },
  infoLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginTop: 2,
    textTransform: "capitalize",
  },
  section: {
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  sectionBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  actionBtn: {
    paddingVertical: 14,
    alignItems: "center",
    marginVertical: 4,
  },
  btnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
  fertCard: {
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  fertName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
  },
  fertMeta: {
    flexDirection: "row",
    gap: 6,
  },
  fertTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  fertTypeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
  },
  fertDetail: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  fertDetailLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    width: 88,
    paddingTop: 1,
  },
  fertDetailValue: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 19,
  },
  fertGuidance: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginTop: 4,
    fontStyle: "italic",
  },
  voiceTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
    marginBottom: 4,
  },
  langGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  langText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  errorState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  voiceSheet: { flex: 1 },
  voiceSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  voiceSheetTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  voiceText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    lineHeight: 26,
  },
});
