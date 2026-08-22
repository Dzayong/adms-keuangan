import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { useAuthStore } from '../store/authStore';

const SERVICES = [
  { icon: 'card-outline', title: 'SINAR', subtitle: 'Perpanjangan & Pendaftaran SIM Nasional', badge: 'Aktif' },
  { icon: 'globe-outline', title: 'SIM Internasional', subtitle: 'Registrasi & perpanjangan SIM Internasional', badge: 'Aktif' },
  { icon: 'car-sport-outline', title: 'SIGNAL', subtitle: 'Samsat Digital Nasional', badge: 'Segera' },
];

const ADVANTAGES = [
  { icon: 'shield-checkmark-outline', title: 'Digital ID Terenkripsi', desc: 'Identitas digital aman tersimpan secara online' },
  { icon: 'finger-print-outline', title: 'Biometrik Face Recognition', desc: 'Autentikasi wajah terintegrasi dengan data Dukcapil' },
  { icon: 'flash-outline', title: 'Proses Cepat', desc: 'Administrasi mudah tanpa antri di kantor' },
  { icon: 'wallet-outline', title: 'Multi Pembayaran', desc: 'Virtual Account BNI dan berbagai channel' },
  { icon: 'home-outline', title: 'Dikirim ke Rumah', desc: 'SIM dikirim langsung via POS Indonesia' },
];

export default function HomeScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Selamat datang,</Text>
          <Text style={styles.headerName}>{user?.name ?? 'Pengguna'}</Text>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="shield-checkmark" size={16} color={COLORS.surface} />
          <Text style={styles.headerBadgeText}>Terverifikasi</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero Banner */}
        <View style={styles.hero}>
          <Text style={styles.heroTagline}>Stop Pelanggaran,{'\n'}Stop Kecelakaan!</Text>
          <Text style={styles.heroSub}>Keselamatan Untuk Kemanusiaan</Text>
          <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.navigate('Services')}>
            <Text style={styles.heroBtnText}>Mulai Pengajuan</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.surface} />
          </TouchableOpacity>
        </View>

        {/* Layanan Utama */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionBar} />
            <Text style={styles.sectionTitle}>LAYANAN UTAMA</Text>
          </View>
          {SERVICES.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.serviceCard, s.badge === 'Segera' && styles.serviceCardDisabled]}
              onPress={() => s.badge !== 'Segera' && navigation.navigate('Services')}
              disabled={s.badge === 'Segera'}
            >
              <View style={styles.serviceIconWrap}>
                <Ionicons name={s.icon as any} size={24} color={COLORS.accent} />
              </View>
              <View style={styles.serviceText}>
                <Text style={styles.serviceTitle}>{s.title}</Text>
                <Text style={styles.serviceSubtitle}>{s.subtitle}</Text>
              </View>
              <View style={[styles.badge, s.badge === 'Segera' ? styles.badgeSoon : styles.badgeActive]}>
                <Text style={[styles.badgeText, s.badge === 'Segera' ? styles.badgeSoonText : styles.badgeActiveText]}>
                  {s.badge}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Keunggulan */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionBar} />
            <Text style={styles.sectionTitle}>KEUNGGULAN UTAMA</Text>
          </View>
          <View style={styles.advantageGrid}>
            {ADVANTAGES.map((a, i) => (
              <View key={i} style={styles.advantageCard}>
                <Ionicons name={a.icon as any} size={28} color={COLORS.accent} />
                <Text style={styles.advantageTitle}>{a.title}</Text>
                <Text style={styles.advantageDesc}>{a.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Cara Pakai */}
        <View style={[styles.section, { marginBottom: 32 }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionBar} />
            <Text style={styles.sectionTitle}>CARA PAKAI</Text>
          </View>
          {['Download & Install Aplikasi', 'Daftar & Verifikasi Data', 'Gunakan Semua Layanan'].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepLabel}>{step}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerGreeting: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  headerName: { color: COLORS.surface, fontSize: 18, fontWeight: '700', marginTop: 2 },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  headerBadgeText: { color: COLORS.surface, fontSize: 11, fontWeight: '600' },
  hero: {
    backgroundColor: COLORS.navySoft,
    padding: 24, margin: 16, borderRadius: 0,
  },
  heroTagline: { color: COLORS.surface, fontSize: 22, fontWeight: '800', lineHeight: 30 },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 6, marginBottom: 16 },
  heroBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.accent, paddingVertical: 12, paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  heroBtnText: { color: COLORS.surface, fontWeight: '700', fontSize: 14 },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 8 },
  sectionBar: { width: 4, height: 16, backgroundColor: COLORS.accent },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.textSecondary, letterSpacing: 1 },
  serviceCard: {
    backgroundColor: COLORS.surface, flexDirection: 'row', alignItems: 'center',
    padding: 16, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, gap: 12,
  },
  serviceCardDisabled: { opacity: 0.5 },
  serviceIconWrap: { width: 44, height: 44, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  serviceText: { flex: 1 },
  serviceTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  serviceSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3 },
  badgeActive: { backgroundColor: 'rgba(46,125,91,0.12)' },
  badgeSoon: { backgroundColor: '#F1F5F9' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeActiveText: { color: COLORS.success },
  badgeSoonText: { color: COLORS.textSecondary },
  advantageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  advantageCard: {
    backgroundColor: COLORS.surface, padding: 16, width: '47%',
    borderWidth: 1, borderColor: COLORS.border, gap: 6,
  },
  advantageTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  advantageDesc: { fontSize: 11, color: COLORS.textSecondary, lineHeight: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  stepNum: { width: 32, height: 32, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  stepNumText: { color: COLORS.surface, fontWeight: '800', fontSize: 14 },
  stepLabel: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
});
