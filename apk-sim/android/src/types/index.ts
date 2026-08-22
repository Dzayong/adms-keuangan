export type UserRole = 'customer' | 'admin';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  nik?: string;
  no_hp?: string;
  created_at: string;
}

export type SubmissionStatus = 'Pending' | 'Approved' | 'Rejected';

export type JenisSIM = 'A' | 'C' | 'B1' | 'B2' | 'Internasional';

export interface Submission {
  id: number;
  resi_id: string;
  user_email: string;
  nama: string;
  nik: string;
  no_hp: string;
  jenis_sim: JenisSIM;
  satpas: string;
  service_title: string;
  status: SubmissionStatus;
  created_at: string;
}

export interface SatpasLocation {
  id: number;
  nama_satpas: string;
  wilayah: string;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Services: undefined;
  Status: undefined;
  Profile: undefined;
};

export type ServicesStackParamList = {
  ServicesList: undefined;
  ServiceDetail: { serviceId: string; title: string };
  SubmissionForm: { serviceId: string; title: string };
  LivenessCheck: { onSuccess: () => void };
  DocumentUpload: { submissionData: Partial<Submission> };
  Payment: { resi_id: string; amount: number };
};
