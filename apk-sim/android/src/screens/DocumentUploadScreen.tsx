import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { ServicesStackParamList } from '../types';
import { submissionAPI } from '../services/api';

type Route = RouteProp<ServicesStackParamList, 'DocumentUpload'>;

interface DocItem {
  key: string;
  label: string;
  desc: string;
  required: boolean;
  uri?: string;
}

export default function DocumentUploadScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { submissionData } = route.params;

  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<DocItem[]>([
    { key: 'foto_ktp', label: 'Foto E-KTP', desc: 'Pastikan semua tulisan terbaca jelas', required: true },
    { key: 'foto_sim_lama', label: 'Foto SIM Lama', desc: 'Untuk perpanjangan SIM', required: false },
    { key: 'foto_diri', label: 'Foto Diri', desc: 'Latar belakang biru, 4x6, tampak depan', required: true },
    { key: 'foto_ttd', label: 'Foto Tanda Tangan', desc: 'Di kertas putih, tinta hitam', required: true },
    { key: 'surat_sehat', label: 'Surat Tes Kesehatan', desc: 'Dari erikkes.id', required: true },
    { key: 'surat_psikologi', label: 'Surat Tes Psikologi', desc: 'Dari app.eppsi.id', required: true },
  ]);

  const pickImage = async (key: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Diperlukan', 'Akses galeri diperlukan untuk upload dokumen.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: key === 'foto_diri' ? [3, 4] : [4, 3],
    });
    if (!result.canceled) {
      setDocs(prev => prev.map(d => d.key === key ? { ...d, uri: result.assets[0].uri } : d));
    }
  };

  const takePhoto = async (key: string) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Diperlukan', 'Akses kamera diperlukan.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setDocs(prev => prev.map(d => d.key === key ? { ...d, uri: result.assets[0].uri } : d));
    }
  };

  const handlePickOption = (key: string) => {
    Alert.alert('Upload Dokumen', 'Pilih sumber foto', [
      { text: 'Kamera', onPress: () => takePhoto(key) },
      { text: 'Galeri', onPress: () => pickImage(key) },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  const allRequiredUploaded = docs.filter(d => d.required).every(d => d.uri);

  const handleSubmit = async () => {
    if (!allRequiredUploaded) {
      Alert.alert('Dokumen Belum Lengkap', 'Upload semua dokumen yang wajib terlebih dahulu.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(submissionData).forEach(([k, v]) => {
        if (v) formData.append(k, v as string);
      });
      docs.forEach(doc => {
        if (doc.uri) {
          formData.append(doc.key, {
            uri: doc.uri,
            name: `${doc.key}.jpg`,
            type: 'image/jpeg',
          } as any);
        }
      });
      const res = await submissionAPI.create(formData);
      const { resi_id, amount } = res.data;
      navigation.navigate('Payment', { resi_id, amount });
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Gagal mengirim pengajuan. Coba lagi.';
      Alert.alert('Gagal', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.accent} />
          <Text style={styles.noticeText}>
            Pastikan semua foto jelas, tidak buram, dan tidak terpotong. Dokumen bintang (*) wajib diupload.
          </Text>
        </View>

        <View style={styles.list}>
          {docs.map((doc) => (
            <View key={doc.key} style={styles.docCard}>
              <View style={styles.docHeader}>
                <Text style={styles.docLabel}>
                  {doc.label} {doc.required && <Text style={styles.required}>*</Text>}
                </Text>
                <Text style={styles.docDesc}>{doc.desc}</Text>
              </View>
              {doc.uri ? (
                <TouchableOpacity onPress={() => handlePickOption(doc.key)} activeOpacity={0.8}>
                  <Image source={{ uri: doc.uri }} style={styles.preview} />
                  <View style={styles.reuploadOverlay}>
                    <Ionicons name="camera-outline" size={18} color={COLORS.surface} />
                    <Text style={styles.reuploadText}>Ganti</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.uploadBtn} onPress={() => handlePickOption(doc.key)}>
                  <Ionicons name="cloud-upload-outline" size={28} color={COLORS.textSecondary} />
                  <Text style={styles.uploadBtnText}>Tap untuk upload</Text>
                  <Text style={styles.uploadBtnSub}>Kamera atau Galeri</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Progress */}
        <View style={styles.progress}>
          <Text style={styles.progressText}>
            {docs.filter(d => d.uri).length} dari {docs.length} dokumen terupload
            {' '}({docs.filter(d => d.required && d.uri).length}/{docs.filter(d => d.required).length} wajib)
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, {
              width: `${(docs.filter(d => d.uri).length / docs.length) * 100}%`,
            }]} />
          </View>
        </View>

      </ScrollView>

      <View style={styles.cta}>
        <TouchableOpacity
          style={[styles.ctaBtn, !allRequiredUploaded && styles.ctaBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading || !allRequiredUploaded}
        >
          {loading
            ? <ActivityIndicator color={COLORS.surface} />
            : <>
              <Text style={styles.ctaBtnText}>Kirim & Lanjut Pembayaran</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.surface} />
            </>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  notice: { flexDirection: 'row', gap: 8, backgroundColor: '#EFF6FF', padding: 14, margin: 16, borderWidth: 1, borderColor: '#BFDBFE', alignItems: 'flex-start' },
  noticeText: { flex: 1, fontSize: 12, color: COLORS.accent, lineHeight: 18 },
  list: { paddingHorizontal: 16, gap: 12 },
  docCard: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  docHeader: { padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  docLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  required: { color: COLORS.warning },
  docDesc: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  uploadBtn: { padding: 24, alignItems: 'center', gap: 6, backgroundColor: COLORS.cardHover },
  uploadBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  uploadBtnSub: { fontSize: 11, color: COLORS.border },
  preview: { width: '100%', height: 160, resizeMode: 'cover' },
  reuploadOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 6, paddingHorizontal: 10,
  },
  reuploadText: { color: COLORS.surface, fontSize: 12, fontWeight: '600' },
  progress: { marginHorizontal: 16, marginTop: 16 },
  progressText: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 },
  progressBar: { height: 4, backgroundColor: COLORS.border },
  progressFill: { height: 4, backgroundColor: COLORS.accent },
  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  ctaBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 15 },
  ctaBtnDisabled: { backgroundColor: COLORS.border },
  ctaBtnText: { color: COLORS.surface, fontWeight: '800', fontSize: 15 },
});
