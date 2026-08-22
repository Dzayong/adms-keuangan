import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions, FaceDetectionResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { ServicesStackParamList } from '../types';

type Route = RouteProp<ServicesStackParamList, 'LivenessCheck'>;

type Step = 'idle' | 'checking' | 'blink' | 'done' | 'fail';

export default function LivenessCheckScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<Step>('idle');
  const [instruction, setInstruction] = useState('Posisikan wajah di dalam lingkaran');
  const [faceDetected, setFaceDetected] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleFacesDetected = ({ faces }: FaceDetectionResult) => {
    const face = faces[0];
    if (!face) {
      setFaceDetected(false);
      return;
    }
    setFaceDetected(true);

    if (step === 'idle') {
      setStep('checking');
      setInstruction('Wajah terdeteksi — tetap diam sebentar...');
      timerRef.current = setTimeout(() => {
        setStep('blink');
        setInstruction('Kedipkan mata pelan-pelan');
      }, 2000);
    }

    if (step === 'blink' && face.leftEyeOpenProbability !== undefined) {
      const leftClosed = face.leftEyeOpenProbability < 0.3;
      const rightClosed = (face.rightEyeOpenProbability ?? 1) < 0.3;
      if (leftClosed && rightClosed) {
        if (timerRef.current) clearTimeout(timerRef.current);
        setStep('done');
        setInstruction('Verifikasi berhasil!');
        timerRef.current = setTimeout(() => {
          route.params.onSuccess();
        }, 1000);
      }
    }
  };

  const reset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStep('idle');
    setFaceDetected(false);
    setInstruction('Posisikan wajah di dalam lingkaran');
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={56} color={COLORS.textSecondary} />
        <Text style={styles.permTitle}>Izin Kamera Diperlukan</Text>
        <Text style={styles.permSub}>Verifikasi wajah membutuhkan akses kamera untuk memastikan kamu adalah pengguna yang sah.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Izinkan Kamera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const overlayColor = step === 'done'
    ? COLORS.success
    : step === 'fail'
    ? COLORS.warning
    : faceDetected
    ? COLORS.accent
    : COLORS.border;

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="front"
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={{
          mode: 'fast',
          detectLandmarks: 'none',
          runClassifications: 'all',
          minDetectionInterval: 150,
          tracking: true,
        }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top area */}
        <View style={styles.topArea}>
          <Text style={styles.title}>Verifikasi Wajah</Text>
          <Text style={styles.subtitle}>Pastikan wajah kamu terlihat jelas dan pencahayaan cukup</Text>
        </View>

        {/* Face oval */}
        <View style={[styles.oval, { borderColor: overlayColor }]}>
          {step === 'done' && <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />}
        </View>

        {/* Instruction */}
        <View style={styles.bottomArea}>
          <View style={[styles.instructionBox, { borderColor: overlayColor }]}>
            <Ionicons
              name={step === 'done' ? 'checkmark-circle-outline' : 'eye-outline'}
              size={18}
              color={overlayColor}
            />
            <Text style={[styles.instructionText, { color: overlayColor }]}>{instruction}</Text>
          </View>

          {(step === 'idle' || step === 'fail') && (
            <TouchableOpacity style={styles.resetBtn} onPress={reset}>
              <Text style={styles.resetBtnText}>Coba Lagi</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  permTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  permSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  permBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  permBtnText: { color: COLORS.surface, fontWeight: '800', fontSize: 15 },
  overlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 48 },
  topArea: { alignItems: 'center', gap: 8, paddingHorizontal: 32 },
  title: { color: COLORS.surface, fontSize: 20, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 13, textAlign: 'center' },
  oval: {
    width: 220, height: 280, borderRadius: 110,
    borderWidth: 3, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'transparent',
  },
  bottomArea: { alignItems: 'center', gap: 16, paddingHorizontal: 32 },
  instructionBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 12, paddingHorizontal: 20,
    borderWidth: 1, borderRadius: 0,
  },
  instructionText: { fontSize: 14, fontWeight: '700' },
  resetBtn: { backgroundColor: COLORS.surface, paddingVertical: 12, paddingHorizontal: 32 },
  resetBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: 14 },
});
