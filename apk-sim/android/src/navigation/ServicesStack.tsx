import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ServicesStackParamList } from '../types';
import { COLORS } from '../constants/colors';
import ServicesScreen from '../screens/ServicesScreen';
import ServiceDetailScreen from '../screens/ServiceDetailScreen';
import SubmissionFormScreen from '../screens/SubmissionFormScreen';
import LivenessCheckScreen from '../screens/LivenessCheckScreen';
import DocumentUploadScreen from '../screens/DocumentUploadScreen';
import PaymentScreen from '../screens/PaymentScreen';

const Stack = createNativeStackNavigator<ServicesStackParamList>();

export default function ServicesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.surface,
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
        headerBackTitle: '',
      }}
    >
      <Stack.Screen name="ServicesList" component={ServicesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={({ route }) => ({ title: route.params.title })} />
      <Stack.Screen name="SubmissionForm" component={SubmissionFormScreen} options={{ title: 'Isi Data Pengajuan' }} />
      <Stack.Screen name="LivenessCheck" component={LivenessCheckScreen} options={{ title: 'Verifikasi Wajah' }} />
      <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} options={{ title: 'Upload Dokumen' }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Pembayaran' }} />
    </Stack.Navigator>
  );
}
