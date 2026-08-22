import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { ServicesStackParamList } from '../types';

type Route = RouteProp<ServicesStackParamList, 'ServiceDetail'>;

const SERVICE_INFO: Record<string, {
  icon: string; desc: string; biaya: string;
  syarat: string[]; steps: string[];
}> = {
  'perpanjangan-sim': {
    icon: 'card-outline',
    desc: 'Perpanjangan SIM A & C secara online tanpa perlu datang ke SATPAS. Tes kesehatan & psikologi terintegrasi melalui E-Rikkes dan EPPsi.',
    biaya: 'SIM A: Rp 80.000 | SIM C: Rp 75.000\n+ biaya admin, kemasan, & ongkir',
    syarat: [
      'SIM lama (berlaku atau kurang dari 90 hari kadaluarsa)',
      'E-KTP asli',
      'Hasil tes kesehatan (erikkes.id)',
      'Hasil tes psikologi (app.eppsi.id)',
      'Foto dengan latar biru (4x6)',
      'Foto tanda tangan di kertas putih',
    ],
    steps: [
      'Lengkapi data diri & pilih jenis SIM',
      'Verifikasi wajah (liveness check)',
      'Upload semua dokumen persyaratan',
      'Pilih SATPAS & metode pengiriman',
      'Bayar via Virtual Account BNI',
      'Tunggu verifikasi SATPAS (3–7 hari kerja)',
    ],
  },
  'pendaftaran-sim-baru': {
    icon: 'document-text-outline',
    desc: 'Daftar SIM baru secara online. Ujian teori bisa dilakukan dari rumah, ujian praktik di SATPAS yang kamu pilih.',
    biaya: 'SIM A: Rp 120.000 | SIM C: Rp 100.000\n+ biaya ujian & penerbitan',
    syarat: [
      'E-KTP asli',
      'Foto dengan latar biru (4x6)',
      'Foto tanda tangan di kertas putih',
      'Hasil tes kesehatan (erikkes.id)',
      'Hasil tes psikologi (app.eppsi.id)',
    ],
    steps: [
      'Lengkapi data diri & pilih jenis SIM',
      'Verifikasi wajah (liveness check)',
      'Upload semua dokumen persyaratan',
      'Pilih SATPAS untuk ujian praktik',
      'Bayar via Virtual Account BNI',
      'Ikuti ujian teori online dari rumah',
      'Jadwalkan & ikuti ujian praktik di SATPAS',
    ],
  },
  'sim-internasional-baru': {
    icon: 'globe-outline',
    desc: 'Registrasi SIM Internasional untuk WNI yang akan berkendara di luar negeri. Proses verifikasi dokumen dilakukan secara digital.',
    biaya: 'Rp 250.000\n+ biaya admin & ongkir',
    syarat: [
      'SIM Indonesia yang masih berlaku',
      'E-KTP asli',
      'Paspor aktif',
      'Foto dengan latar biru (4x6)',
    ],
    steps: [
      'Lengkapi data diri & unggah dokumen',
      'Verifikasi wajah (liveness check)',
      'Bayar via Virtual Account BNI',
      'Tunggu verifikasi & pengiriman (5–10 hari kerja)',
    ],
  },
  'sim-internasional-perpanjang': {
    icon: 'sync-outline',
    desc: 'Perpanjangan SIM Internasional dengan mengunggah persyaratan dan SIM Internasional lama secara digital.',
    biaya: 'Rp 225.000\n+ biaya admin & ongkir',
    syarat: [
      'SIM Internasional lama',
      'SIM Indonesia yang masih berlaku',
      'E-KTP asli',
      'Foto dengan latar biru (4x6)',
    ],
    steps: [
      'Lengkapi data diri & unggah dokumen',
      'Verifikasi wajah (liveness check)',
      'Bayar via Virtual Account BNI',
      'Tunggu verifikasi & pengiriman (5–10 hari kerja)',
    ],
  },
};

export default function ServiceDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { serviceId, title } = route.params;
  const info = SERVICE_INFO[serviceId];

  if (!info) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Layanan tidak ditemukan.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name={info.icon as any} size={32} color={COLORS.accent} />
          </View>
          <Text style={styles.heroTitle}>{title}</Text>
          <Text style={styles.heroDesc}>{info.desc}</Text>
        </View>

        {/* Biaya */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionBar} />
            <Text style={styles.sectionTitle}>BIAYA</Text>
          </View>
          <View style={styles.biayaCard}>
            <Ionicons name="wallet-outline" size={20} color={COLORS.accent} />
            <Text style={styles.biayaText}>{info.biaya}</Text>
          </View>
        </View>

        {/* Syarat */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionBar} />
            <Text style={styles.sectionTitle}>PERSYARATAN</Text>
          </View>
          {info.syarat.map((s, i) => (
            <View key={i} style={styles.listRow}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.listText}>{s}</Text>
            </View>
          ))}
        </View>

        {/* Langkah */}
        <View style={[styles.section, { marginBottom: 120 }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionBar} />
            <Text style={styles.sectionTitle}>LANGKAH PENGAJUAN</Text>
          </View>
          {info.steps.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{s}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* CTA sticky */}
      <View style={styles.cta}>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => navigation.navigate('SubmissionForm', { serviceId, title })}
        >
          <Text style={styles.ctaBtnText}>Mulai Pengajuan</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.surface} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: COLORS.textSecondary },
  hero: { backgroundColor: COLORS.surface, padding: 24, borderBottomWidth: 1, borderBottomColor: COLORS.border, alignItems: 'flex-start', gap: 10 },
  heroIcon: { width: 56, height: 56, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  heroDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionBar: { width: 4, height: 14, backgroundColor: COLORS.accent },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary, letterSpacing: 0.8 },
  biayaCard: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  biayaText: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 20, flex: 1 },
  listRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  listText: { fontSize: 13, color: COLORS.textPrimary, flex: 1, lineHeight: 20 },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  stepNum: { width: 28, height: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  stepNumText: { color: COLORS.surface, fontWeight: '800', fontSize: 12 },
  stepText: { fontSize: 13, color: COLORS.textPrimary, flex: 1, lineHeight: 20, paddingTop: 4 },
  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  ctaBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 15 },
  ctaBtnText: { color: COLORS.surface, fontWeight: '800', fontSize: 15 },
});
