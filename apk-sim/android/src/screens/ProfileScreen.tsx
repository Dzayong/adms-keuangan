import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAuthStore } from '../store/authStore';

const MENU_ITEMS = [
  { icon: 'person-outline', label: 'Data Diri' },
  { icon: 'document-text-outline', label: 'Riwayat Pengajuan' },
  { icon: 'shield-checkmark-outline', label: 'Keamanan Akun' },
  { icon: 'help-circle-outline', label: 'FAQ & Bantuan' },
  { icon: 'information-circle-outline', label: 'Tentang Aplikasi' },
];

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Keluar', 'Yakin ingin keluar dari akun?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={COLORS.surface} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            {user?.nik && (
              <View style={styles.nikBadge}>
                <Ionicons name="card-outline" size={12} color={COLORS.accent} />
                <Text style={styles.nikText}>NIK Terverifikasi</Text>
              </View>
            )}
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon as any} size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.warning} />
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>

        <Text style={styles.version}>JEJAK SIM v1.0.0 — Digital Korlantas POLRI</Text>
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
  userCard: {
    backgroundColor: COLORS.surface, margin: 16,
    padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  avatar: {
    width: 60, height: 60, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  userEmail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  nikBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  nikText: { fontSize: 11, color: COLORS.accent, fontWeight: '600' },
  menuSection: { marginHorizontal: 16, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 15, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  menuIconWrap: { width: 32, height: 32, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, margin: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.warning, backgroundColor: COLORS.surface,
  },
  logoutText: { color: COLORS.warning, fontWeight: '700', fontSize: 15 },
  version: { textAlign: 'center', fontSize: 11, color: COLORS.textSecondary, marginBottom: 32 },
});
