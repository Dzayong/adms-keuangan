import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Perhatian', 'Email dan password wajib diisi');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Email Tidak Valid', 'Format email tidak sesuai');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.login(email.trim().toLowerCase(), password);
      await setUser(res.data.user, res.data.token);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Login gagal. Periksa email & password.';
      Alert.alert('Login Gagal', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <StatusBar />

      {/* Logo area */}
      <View style={styles.logoArea}>
        <View style={styles.logoBox}>
          <Ionicons name="shield-checkmark" size={40} color={COLORS.surface} />
        </View>
        <Text style={styles.appName}>JEJAK SIM</Text>
        <Text style={styles.appTagline}>Digital Korlantas POLRI</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.formTitle}>Masuk ke Akun</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="email@contoh.com"
              placeholderTextColor={COLORS.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color={COLORS.surface} />
            : <Text style={styles.loginBtnText}>Masuk</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerLinkText}>
            Belum punya akun? <Text style={styles.registerLinkBold}>Daftar sekarang</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Placeholder untuk StatusBar
function StatusBar() {
  return <View style={{ height: Platform.OS === 'android' ? 32 : 0, backgroundColor: COLORS.primary }} />;
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.primary },
  logoArea: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  logoBox: {
    width: 72, height: 72, backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  appName: { color: COLORS.surface, fontSize: 26, fontWeight: '900', letterSpacing: 2 },
  appTagline: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 4 },
  form: {
    backgroundColor: COLORS.surface, flex: 1, padding: 24,
    borderTopLeftRadius: 0, borderTopRightRadius: 0,
  },
  formTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background,
  },
  inputIcon: { paddingLeft: 12 },
  input: { flex: 1, paddingVertical: 13, paddingHorizontal: 10, fontSize: 14, color: COLORS.textPrimary },
  eyeBtn: { paddingRight: 12 },
  loginBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 14,
    alignItems: 'center', marginTop: 8, marginBottom: 16,
  },
  loginBtnText: { color: COLORS.surface, fontWeight: '800', fontSize: 15 },
  registerLink: { alignItems: 'center' },
  registerLinkText: { fontSize: 13, color: COLORS.textSecondary },
  registerLinkBold: { color: COLORS.accent, fontWeight: '700' },
});
