import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { setUser } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nik, setNik] = useState('');
  const [noHp, setNoHp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !nik) {
      Alert.alert('Perhatian', 'Nama, email, NIK, dan password wajib diisi');
      return;
    }
    if (!/^[a-zA-Z\s'.,-]{2,100}$/.test(name.trim())) {
      Alert.alert('Nama Tidak Valid', 'Nama hanya boleh mengandung huruf');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Email Tidak Valid', 'Format email tidak sesuai');
      return;
    }
    if (!/^\d{16}$/.test(nik)) {
      Alert.alert('NIK Tidak Valid', 'NIK harus tepat 16 digit angka');
      return;
    }
    if (noHp && !/^\d{10,15}$/.test(noHp)) {
      Alert.alert('No HP Tidak Valid', 'Nomor HP harus 10–15 digit angka');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Password Terlalu Pendek', 'Password minimal 8 karakter');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Tidak Cocok', 'Konfirmasi password tidak sesuai');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        nik,
        no_hp: noHp,
        password,
      });
      await setUser(res.data.user, res.data.token ?? '');
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Registrasi gagal. Coba lagi.';
      Alert.alert('Registrasi Gagal', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buat Akun Baru</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nama Lengkap</Text>
          <TextInput
            style={styles.input}
            placeholder="Sesuai KTP"
            placeholderTextColor={COLORS.textSecondary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@contoh.com"
            placeholderTextColor={COLORS.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>NIK (16 digit)</Text>
          <TextInput
            style={styles.input}
            placeholder="3271xxxxxxxxxx"
            placeholderTextColor={COLORS.textSecondary}
            value={nik}
            onChangeText={setNik}
            keyboardType="numeric"
            maxLength={16}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>No. HP</Text>
          <TextInput
            style={styles.input}
            placeholder="08xxxxxxxxxx"
            placeholderTextColor={COLORS.textSecondary}
            value={noHp}
            onChangeText={setNoHp}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Minimal 8 karakter"
            placeholderTextColor={COLORS.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Konfirmasi Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Ulangi password"
            placeholderTextColor={COLORS.textSecondary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading}>
          {loading
            ? <ActivityIndicator color={COLORS.surface} />
            : <Text style={styles.registerBtnText}>Daftar Sekarang</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.goBack()}>
          <Text style={styles.loginLinkText}>
            Sudah punya akun? <Text style={styles.loginLinkBold}>Masuk</Text>
          </Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.primary },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20,
  },
  headerTitle: { color: COLORS.surface, fontSize: 17, fontWeight: '700' },
  form: { backgroundColor: COLORS.surface, flex: 1, padding: 24 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background,
    paddingVertical: 12, paddingHorizontal: 14, fontSize: 14, color: COLORS.textPrimary,
  },
  registerBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 14,
    alignItems: 'center', marginTop: 8, marginBottom: 16,
  },
  registerBtnText: { color: COLORS.surface, fontWeight: '800', fontSize: 15 },
  loginLink: { alignItems: 'center' },
  loginLinkText: { fontSize: 13, color: COLORS.textSecondary },
  loginLinkBold: { color: COLORS.accent, fontWeight: '700' },
});
