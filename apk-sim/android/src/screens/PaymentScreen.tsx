import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { ServicesStackParamList } from '../types';

type Route = RouteProp<ServicesStackParamList, 'Payment'>;

const VA_NUMBER = '8008-3271-xxxx-yyyy'; // dari backend nanti

const PAYMENT_STEPS = [
  'Buka aplikasi BNI Mobile Banking atau m-banking bank lain',
  'Pilih Transfer → Virtual Account',
  'Masukkan nomor Virtual Account di atas',
  'Periksa detail transaksi & konfirmasi pembayaran',
  'Simpan bukti pembayaran sebagai referensi',
];

export default function PaymentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { resi_id, amount } = route.params;
  const [copied, setCopied] = useState(false);

  const copyVA = () => {
    Clipboard.setString(VA_NUMBER.replace(/-/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDone = () => {
    Alert.alert(
      'Pengajuan Terkirim',
      `Pengajuan kamu dengan resi #${resi_id} telah dikirim. Silakan selesaikan pembayaran dan pantau status di tab Status.`,
      [{ text: 'OK', onPress: () => navigation.navigate('ServicesList') }]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Status */}
        <View style={styles.statusBanner}>
          <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
          <Text style={styles.statusTitle}>Pengajuan Berhasil Dikirim</Text>
          <Text style={styles.statusResi}>No. Resi: #{resi_id}</Text>
        </View>

        {/* VA Card */}
        <View style={styles.vaCard}>
          <Text style={styles.vaCardTitle}>Selesaikan Pembayaran</Text>
          <View style={styles.bankRow}>
            <View style={styles.bankBadge}>
              <Text style={styles.bankText}>BNI</Text>
            </View>
            <Text style={styles.bankLabel}>Virtual Account BNI</Text>
          </View>

          <View style={styles.vaNumberBox}>
            <Text style={styles.vaNumber}>{VA_NUMBER}</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={copyVA}>
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={copied ? COLORS.success : COLORS.accent} />
              <Text style={[styles.copyText, copied && { color: COLORS.success }]}>
                {copied ? 'Tersalin' : 'Salin'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total Pembayaran</Text>
            <Text style={styles.amountValue}>
              Rp {amount?.toLocaleString('id-ID') ?? '—'}
            </Text>
          </View>

          <View style={styles.expireNotice}>
            <Ionicons name="time-outline" size={14} color={COLORS.warning} />
            <Text style={styles.expireText}>Batas waktu pembayaran: 24 jam</Text>
          </View>
        </View>

        {/* Cara Bayar */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionBar} />
            <Text style={styles.sectionTitle}>CARA PEMBAYARAN</Text>
          </View>
          {PAYMENT_STEPS.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Refund info */}
        <View style={[styles.section, { marginBottom: 16 }]}>
          <View style={styles.refundBox}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.refundText}>
              Jika pengajuan ditolak, refund diproses dalam 1–5 hari kerja (dikurangi biaya admin Rp 10.000 + Rp 6.500 transfer). Biaya tes psikologi tidak dapat dikembalikan.
            </Text>
          </View>
        </View>

      </ScrollView>

      <View style={styles.cta}>
        <TouchableOpacity style={styles.ctaBtn} onPress={handleDone}>
          <Text style={styles.ctaBtnText}>Pantau Status Pengajuan</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.surface} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  statusBanner: { backgroundColor: COLORS.surface, alignItems: 'center', padding: 32, gap: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  statusTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  statusResi: { fontSize: 13, color: COLORS.textSecondary },
  vaCard: { backgroundColor: COLORS.surface, margin: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border, gap: 14 },
  vaCardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  bankRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bankBadge: { backgroundColor: '#FF6600', paddingHorizontal: 10, paddingVertical: 4 },
  bankText: { color: COLORS.surface, fontWeight: '900', fontSize: 13 },
  bankLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  vaNumberBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.background, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  vaNumber: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 1 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  copyText: { fontSize: 13, color: COLORS.accent, fontWeight: '600' },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountLabel: { fontSize: 13, color: COLORS.textSecondary },
  amountValue: { fontSize: 20, fontWeight: '900', color: COLORS.primary },
  expireNotice: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  expireText: { fontSize: 12, color: COLORS.warning, fontWeight: '500' },
  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionBar: { width: 4, height: 14, backgroundColor: COLORS.accent },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary, letterSpacing: 0.8 },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  stepNum: { width: 24, height: 24, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  stepNumText: { color: COLORS.surface, fontWeight: '800', fontSize: 11 },
  stepText: { fontSize: 13, color: COLORS.textPrimary, flex: 1, lineHeight: 20, paddingTop: 2 },
  refundBox: { flexDirection: 'row', gap: 8, backgroundColor: COLORS.cardHover, padding: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: 'flex-start' },
  refundText: { flex: 1, fontSize: 11, color: COLORS.textSecondary, lineHeight: 17 },
  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  ctaBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 15 },
  ctaBtnText: { color: COLORS.surface, fontWeight: '800', fontSize: 15 },
});
