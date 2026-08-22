import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { ServicesStackParamList, SatpasLocation, JenisSIM } from '../types';
import { satpasAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

type Route = RouteProp<ServicesStackParamList, 'SubmissionForm'>;

const SIM_OPTIONS: JenisSIM[] = ['A', 'C', 'B1', 'B2', 'Internasional'];

const DELIVERY_OPTIONS = [
  { value: 'pos', label: 'POS Indonesia', desc: 'Dikirim ke alamat KTP (3–7 hari)' },
  { value: 'pickup', label: 'Ambil di SATPAS', desc: 'Ambil sendiri setelah SIM selesai' },
];

export default function SubmissionFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { serviceId, title } = route.params;
  const { user } = useAuthStore();

  const [satpasList, setSatpasList] = useState<SatpasLocation[]>([]);
  const [loadingSatpas, setLoadingSatpas] = useState(true);
  const [jenisSim, setJenisSim] = useState<JenisSIM>('A');
  const [selectedSatpas, setSelectedSatpas] = useState('');
  const [delivery, setDelivery] = useState('pos');
  const [noHp, setNoHp] = useState(user?.no_hp ?? '');
  const [alamat, setAlamat] = useState('');
  const [showSatpasPicker, setShowSatpasPicker] = useState(false);

  useEffect(() => {
    satpasAPI.getAll()
      .then(res => setSatpasList(res.data))
      .catch(() => {})
      .finally(() => setLoadingSatpas(false));
  }, []);

  const handleNext = () => {
    if (!noHp || !selectedSatpas) {
      Alert.alert('Lengkapi Data', 'No. HP dan SATPAS wajib dipilih.');
      return;
    }
    if (delivery === 'pos' && !alamat) {
      Alert.alert('Lengkapi Data', 'Alamat pengiriman wajib diisi.');
      return;
    }
    navigation.navigate('LivenessCheck', {
      onSuccess: () =>
        navigation.navigate('DocumentUpload', {
          submissionData: {
            nama: user?.name,
            nik: user?.nik,
            no_hp: noHp,
            jenis_sim: jenisSim,
            satpas: selectedSatpas,
            service_title: title,
          },
        }),
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Info user */}
        <View style={styles.infoCard}>
          <Ionicons name="person-circle-outline" size={20} color={COLORS.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoName}>{user?.name}</Text>
            <Text style={styles.infoNik}>NIK: {user?.nik ?? '—'}</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
            <Text style={styles.verifiedText}>Terverifikasi</Text>
          </View>
        </View>

        <View style={styles.form}>

          {/* Jenis SIM */}
          <View style={styles.field}>
            <Text style={styles.label}>Jenis SIM</Text>
            <View style={styles.chipRow}>
              {SIM_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.chip, jenisSim === opt && styles.chipActive]}
                  onPress={() => setJenisSim(opt)}
                >
                  <Text style={[styles.chipText, jenisSim === opt && styles.chipTextActive]}>
                    SIM {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* No HP */}
          <View style={styles.field}>
            <Text style={styles.label}>Nomor HP Aktif</Text>
            <TextInput
              style={styles.input}
              value={noHp}
              onChangeText={setNoHp}
              keyboardType="phone-pad"
              placeholder="08xxxxxxxxxx"
              placeholderTextColor={COLORS.textSecondary}
              maxLength={15}
            />
          </View>

          {/* SATPAS */}
          <View style={styles.field}>
            <Text style={styles.label}>Pilih SATPAS</Text>
            {loadingSatpas ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginTop: 8 }} />
            ) : (
              <>
                <TouchableOpacity style={styles.selector} onPress={() => setShowSatpasPicker(!showSatpasPicker)}>
                  <Text style={[styles.selectorText, !selectedSatpas && styles.placeholder]}>
                    {selectedSatpas || 'Pilih SATPAS terdekat'}
                  </Text>
                  <Ionicons name={showSatpasPicker ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
                {showSatpasPicker && (
                  <View style={styles.dropdown}>
                    {satpasList.map((s, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.dropdownItem, i < satpasList.length - 1 && styles.dropdownItemBorder]}
                        onPress={() => { setSelectedSatpas(s.nama_satpas); setShowSatpasPicker(false); }}
                      >
                        <Text style={styles.dropdownName}>{s.nama_satpas}</Text>
                        <Text style={styles.dropdownWilayah}>{s.wilayah}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>

          {/* Pengiriman */}
          <View style={styles.field}>
            <Text style={styles.label}>Metode Pengiriman SIM</Text>
            {DELIVERY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.deliveryCard, delivery === opt.value && styles.deliveryCardActive]}
                onPress={() => setDelivery(opt.value)}
              >
                <View style={[styles.radio, delivery === opt.value && styles.radioActive]}>
                  {delivery === opt.value && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.deliveryLabel}>{opt.label}</Text>
                  <Text style={styles.deliveryDesc}>{opt.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Alamat (jika POS) */}
          {delivery === 'pos' && (
            <View style={styles.field}>
              <Text style={styles.label}>Alamat Pengiriman</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                value={alamat}
                onChangeText={setAlamat}
                placeholder="Jl. Contoh No. 1, Kelurahan, Kecamatan, Kota, Kode Pos"
                placeholderTextColor={COLORS.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>
          )}

          {/* Notice */}
          <View style={styles.notice}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.accent} />
            <Text style={styles.noticeText}>
              Langkah selanjutnya: verifikasi wajah (liveness check) dan upload dokumen persyaratan.
            </Text>
          </View>

        </View>
      </ScrollView>

      <View style={styles.cta}>
        <TouchableOpacity style={styles.ctaBtn} onPress={handleNext}>
          <Text style={styles.ctaBtnText}>Lanjut — Verifikasi Wajah</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.surface} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#EFF6FF', margin: 16, padding: 14,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  infoName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  infoNik: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontSize: 11, color: COLORS.success, fontWeight: '600' },
  form: { paddingHorizontal: 16 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.surface },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.surface },
  input: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, paddingVertical: 12, paddingHorizontal: 14, fontSize: 14, color: COLORS.textPrimary },
  inputMulti: { textAlignVertical: 'top', minHeight: 80 },
  selector: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectorText: { fontSize: 14, color: COLORS.textPrimary, flex: 1 },
  placeholder: { color: COLORS.textSecondary },
  dropdown: { borderWidth: 1, borderTopWidth: 0, borderColor: COLORS.border, backgroundColor: COLORS.surface, maxHeight: 220 },
  dropdownItem: { padding: 14 },
  dropdownItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dropdownName: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  dropdownWilayah: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  deliveryCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, padding: 14, marginBottom: 8 },
  deliveryCardActive: { borderColor: COLORS.accent, backgroundColor: '#EFF6FF' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: COLORS.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.accent },
  deliveryLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  deliveryDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  notice: { flexDirection: 'row', gap: 8, backgroundColor: '#EFF6FF', padding: 12, alignItems: 'flex-start', borderWidth: 1, borderColor: '#BFDBFE' },
  noticeText: { flex: 1, fontSize: 12, color: COLORS.accent, lineHeight: 18 },
  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  ctaBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 15 },
  ctaBtnText: { color: COLORS.surface, fontWeight: '800', fontSize: 15 },
});
