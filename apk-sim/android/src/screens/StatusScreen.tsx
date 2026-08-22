import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, Platform, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { submissionAPI } from '../services/api';
import { Submission } from '../types';

const STATUS_CONFIG = {
  Pending:  { color: '#B3261E', bg: '#FFF5F5', icon: 'time-outline' as const },
  Approved: { color: COLORS.success, bg: '#F0FDF4', icon: 'checkmark-circle-outline' as const },
  Rejected: { color: COLORS.textSecondary, bg: '#F8FAFC', icon: 'close-circle-outline' as const },
};

export default function StatusScreen() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await submissionAPI.getMySubmissions();
      setSubmissions(res.data);
    } catch {
      // no-op
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Status Pengajuan</Text>
        <Text style={styles.headerSub}>Pantau proses pengajuan SIM-mu</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color={COLORS.primary} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[COLORS.primary]} />}
          contentContainerStyle={submissions.length === 0 && styles.empty}
        >
          {submissions.length === 0 ? (
            <View style={styles.emptyContent}>
              <Ionicons name="document-text-outline" size={56} color={COLORS.border} />
              <Text style={styles.emptyText}>Belum ada pengajuan</Text>
              <Text style={styles.emptySubText}>Pengajuan SIM-mu akan muncul di sini</Text>
            </View>
          ) : (
            <>
              {submissions.map((s) => {
                const cfg = STATUS_CONFIG[s.status];
                return (
                  <View key={s.id} style={styles.card}>
                    <View style={styles.cardTop}>
                      <View>
                        <Text style={styles.resi}>#{s.resi_id}</Text>
                        <Text style={styles.serviceTitle}>{s.service_title}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                        <Ionicons name={cfg.icon} size={14} color={cfg.color} />
                        <Text style={[styles.statusText, { color: cfg.color }]}>{s.status}</Text>
                      </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.cardMeta}>
                      <Text style={styles.metaItem}>
                        <Text style={styles.metaLabel}>SIM: </Text>{s.jenis_sim}
                      </Text>
                      <Text style={styles.metaItem}>
                        <Text style={styles.metaLabel}>SATPAS: </Text>{s.satpas}
                      </Text>
                      <Text style={styles.metaItem}>
                        <Text style={styles.metaLabel}>Tanggal: </Text>
                        {new Date(s.created_at).toLocaleDateString('id-ID')}
                      </Text>
                    </View>
                  </View>
                );
              })}
              <View style={{ height: 24 }} />
            </>
          )}
        </ScrollView>
      )}
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
  empty: { flex: 1 },
  emptyContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.textSecondary },
  emptySubText: { fontSize: 13, color: COLORS.textSecondary },
  card: {
    backgroundColor: COLORS.surface, marginHorizontal: 16, marginTop: 12,
    borderWidth: 1, borderColor: COLORS.border, padding: 16,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  resi: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 2 },
  serviceTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  cardMeta: { gap: 4 },
  metaItem: { fontSize: 12, color: COLORS.textSecondary },
  metaLabel: { fontWeight: '600', color: COLORS.textPrimary },
});
