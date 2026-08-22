import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';

const SERVICE_GROUPS = [
  {
    group: 'SINAR — SIM NASIONAL PRESISI',
    items: [
      {
        id: 'perpanjangan-sim',
        icon: 'card-outline',
        title: 'Perpanjangan SIM Nasional',
        subtitle: 'Perpanjangan online SIM A & C. Tanpa antre, tes E-Rikkes & EPPsi terintegrasi.',
        badge: 'Aktif',
      },
      {
        id: 'pendaftaran-sim-baru',
        icon: 'document-text-outline',
        title: 'Pendaftaran SIM Baru',
        subtitle: 'Registrasi dan ujian teori online dari rumah. Ujian praktik di SATPAS pilihan.',
        badge: 'Aktif',
      },
    ],
  },
  {
    group: 'SIM INTERNASIONAL',
    items: [
      {
        id: 'sim-internasional-baru',
        icon: 'globe-outline',
        title: 'Registrasi SIM Internasional',
        subtitle: 'Verifikasi dokumen digital untuk WNI yang akan berkendara di luar negeri.',
        badge: 'Aktif',
      },
      {
        id: 'sim-internasional-perpanjang',
        icon: 'sync-outline',
        title: 'Perpanjangan SIM Internasional',
        subtitle: 'Perpanjangan dengan mengunggah persyaratan dan SIM lama.',
        badge: 'Aktif',
      },
    ],
  },
  {
    group: 'SEGERA HADIR',
    items: [
      {
        id: 'signal',
        icon: 'car-sport-outline',
        title: 'SIGNAL',
        subtitle: 'Samsat Digital Nasional — bayar pajak kendaraan online.',
        badge: 'Segera',
      },
      {
        id: 'ntmc',
        icon: 'videocam-outline',
        title: 'NTMC POLRI',
        subtitle: 'Informasi lalu lintas dan CCTV real-time.',
        badge: 'Segera',
      },
      {
        id: 'etle',
        icon: 'shield-alert-outline',
        title: 'ETLE',
        subtitle: 'Cek tilang elektronik kendaraanmu.',
        badge: 'Segera',
      },
    ],
  },
];

export default function ServicesScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Layanan</Text>
        <Text style={styles.headerSub}>Pilih layanan yang kamu butuhkan</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {SERVICE_GROUPS.map((group, gi) => (
          <View key={gi} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBar} />
              <Text style={styles.sectionTitle}>{group.group}</Text>
            </View>
            {group.items.map((item, ii) => {
              const isUpcoming = item.badge === 'Segera';
              return (
                <TouchableOpacity
                  key={ii}
                  style={[styles.card, isUpcoming && styles.cardDisabled]}
                  onPress={() => !isUpcoming && navigation.navigate('ServiceDetail', { serviceId: item.id, title: item.title })}
                  disabled={isUpcoming}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconWrap}>
                    <Ionicons name={item.icon as any} size={22} color={isUpcoming ? COLORS.textSecondary : COLORS.accent} />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={[styles.cardTitle, isUpcoming && styles.cardTitleDisabled]}>{item.title}</Text>
                    <Text style={styles.cardSub}>{item.subtitle}</Text>
                  </View>
                  {isUpcoming
                    ? <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />
                    : <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
                  }
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom: 20, paddingHorizontal: 20,
  },
  headerTitle: { color: COLORS.surface, fontSize: 22, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 4 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionBar: { width: 4, height: 14, backgroundColor: COLORS.accent },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary, letterSpacing: 0.8 },
  card: {
    backgroundColor: COLORS.surface, flexDirection: 'row', alignItems: 'center',
    padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border,
    minHeight: 75, gap: 12,
  },
  cardDisabled: { opacity: 0.55 },
  iconWrap: { width: 40, height: 40, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  cardTitleDisabled: { color: COLORS.textSecondary },
  cardSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 3, lineHeight: 16 },
});
