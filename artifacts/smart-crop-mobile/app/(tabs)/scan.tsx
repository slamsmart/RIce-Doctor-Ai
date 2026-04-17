import { Feather } from "@expo/vector-icons";
import { useCreateScan } from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CROPS = [
  { value: "rice", label: "Rice / Padi" },
  { value: "oil_palm", label: "Oil Palm / Kelapa Sawit" },
  { value: "corn", label: "Corn / Jagung" },
  { value: "cassava", label: "Cassava / Singkong" },
];

const COUNTRIES = [
  { value: "ID", label: "Indonesia" },
  { value: "MY", label: "Malaysia" },
  { value: "TH", label: "Thailand" },
  { value: "VN", label: "Vietnam" },
  { value: "PH", label: "Philippines" },
];

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [cropType, setCropType] = useState("rice");
  const [country, setCountry] = useState("ID");
  const [region, setRegion] = useState("");
  const [farmerName, setFarmerName] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const { mutate: createScan, isPending } = useCreateScan({
    mutation: {
      onSuccess: (scan) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setImageUri(null);
        setImageBase64(null);
        setRegion("");
        setFarmerName("");
        router.push(`/scan-detail/${scan.id}` as any);
      },
      onError: (err) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Scan Failed", "Could not analyze your crop. Please try again.");
      },
    },
  });

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Needed", "Please allow photo access to upload crop images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.7,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
    }
  }

  async function takePhoto() {
    if (Platform.OS === "web") {
      await pickImage();
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Needed", "Please allow camera access to capture crop photos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
    }
  }

  function handleSubmit() {
    if (!region.trim()) {
      Alert.alert("Region Required", "Please enter the region or district name.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createScan({
      data: {
        cropType,
        country,
        region: region.trim(),
        farmerName: farmerName.trim() || null,
        imageBase64: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null,
      },
    });
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
          New Scan
        </Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          AI-powered crop disease detection
        </Text>
      </View>

      <KeyboardAwareScrollViewCompat
        style={styles.scroll}
        bottomOffset={32}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          <TouchableOpacity
            style={[
              styles.photoArea,
              {
                backgroundColor: colors.card,
                borderColor: imageUri ? colors.primary : colors.border,
                borderRadius: colors.radius,
              },
            ]}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            {imageUri ? (
              <>
                <Image
                  source={{ uri: imageUri }}
                  style={[styles.photoPreview, { borderRadius: colors.radius }]}
                  contentFit="cover"
                />
                <View style={styles.photoOverlay}>
                  <Feather name="edit-2" size={20} color="#ffffff" />
                </View>
              </>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Feather name="image" size={32} color={colors.mutedForeground} />
                <Text style={[styles.photoHint, { color: colors.mutedForeground }]}>
                  Tap to add crop photo
                </Text>
                <Text style={[styles.photoHintSub, { color: colors.mutedForeground }]}>
                  (optional — improves detection accuracy)
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.photoActions}>
            <TouchableOpacity
              style={[
                styles.photoBtn,
                { backgroundColor: colors.secondary, borderRadius: colors.radius },
              ]}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              <Feather name="image" size={16} color={colors.primary} />
              <Text style={[styles.photoBtnText, { color: colors.primary }]}>
                Gallery
              </Text>
            </TouchableOpacity>
            {Platform.OS !== "web" && (
              <TouchableOpacity
                style={[
                  styles.photoBtn,
                  { backgroundColor: colors.secondary, borderRadius: colors.radius },
                ]}
                onPress={takePhoto}
                activeOpacity={0.8}
              >
                <Feather name="camera" size={16} color={colors.primary} />
                <Text style={[styles.photoBtnText, { color: colors.primary }]}>
                  Camera
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            CROP TYPE
          </Text>
          <View style={styles.optionGrid}>
            {CROPS.map((c) => (
              <Pressable
                key={c.value}
                style={[
                  styles.optionChip,
                  {
                    backgroundColor:
                      cropType === c.value ? colors.primary : colors.card,
                    borderColor:
                      cropType === c.value ? colors.primary : colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
                onPress={() => {
                  setCropType(c.value);
                  Haptics.selectionAsync();
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        cropType === c.value
                          ? colors.primaryForeground
                          : colors.foreground,
                    },
                  ]}
                >
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            COUNTRY
          </Text>
          <View style={styles.countryGrid}>
            {COUNTRIES.map((c) => (
              <Pressable
                key={c.value}
                style={[
                  styles.countryChip,
                  {
                    backgroundColor:
                      country === c.value ? colors.primary : colors.card,
                    borderColor:
                      country === c.value ? colors.primary : colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
                onPress={() => {
                  setCountry(c.value);
                  Haptics.selectionAsync();
                }}
              >
                <Text
                  style={[
                    styles.countryCode,
                    {
                      color:
                        country === c.value
                          ? colors.primaryForeground
                          : colors.primary,
                    },
                  ]}
                >
                  {c.value}
                </Text>
                <Text
                  style={[
                    styles.countryName,
                    {
                      color:
                        country === c.value
                          ? colors.primaryForeground + "cc"
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            REGION / DISTRICT
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
                borderRadius: colors.radius,
              },
            ]}
            placeholder="e.g. Jawa Barat, Chiang Mai"
            placeholderTextColor={colors.mutedForeground}
            value={region}
            onChangeText={setRegion}
            returnKeyType="next"
          />

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            FARMER NAME (optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
                borderRadius: colors.radius,
              },
            ]}
            placeholder="e.g. Pak Budi Santoso"
            placeholderTextColor={colors.mutedForeground}
            value={farmerName}
            onChangeText={setFarmerName}
            returnKeyType="done"
          />

          <TouchableOpacity
            style={[
              styles.submitBtn,
              {
                backgroundColor: isPending ? colors.muted : colors.primary,
                borderRadius: colors.radius,
              },
            ]}
            onPress={handleSubmit}
            disabled={isPending}
            activeOpacity={0.85}
          >
            {isPending ? (
              <View style={styles.submitLoading}>
                <ActivityIndicator color="#ffffff" />
                <Text style={styles.submitText}>Analyzing with AI...</Text>
              </View>
            ) : (
              <View style={styles.submitInner}>
                <Feather name="zap" size={18} color="#ffffff" />
                <Text style={styles.submitText}>Analyze Crop</Text>
              </View>
            )}
          </TouchableOpacity>

          {Platform.OS === "web" && <View style={{ height: 34 }} />}
        </View>
      </KeyboardAwareScrollViewCompat>
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
  scroll: { flex: 1 },
  body: {
    padding: 16,
    gap: 8,
  },
  photoArea: {
    height: 180,
    borderWidth: 1.5,
    borderStyle: "dashed",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  photoPlaceholder: {
    alignItems: "center",
    gap: 8,
  },
  photoHint: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  photoHintSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  photoPreview: {
    width: "100%",
    height: "100%",
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  photoActions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  photoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  photoBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 4,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  countryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  countryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    alignItems: "center",
    minWidth: 80,
  },
  countryCode: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  countryName: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  submitBtn: {
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  submitText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
});
