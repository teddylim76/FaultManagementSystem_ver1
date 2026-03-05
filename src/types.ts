export type Status = '접수' | '처리중' | '완료';

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
}

export interface FailureRecord {
  id: number;
  date: string;
  location: string;
  affiliation: string;
  name: string;
  contact: string;
  symptom: string;
  status: Status;
  remarks: string;
  received_photo?: string;
  completed_photo?: string;
  created_at: string;
}

export interface Stats {
  total: number;
  received: number;
  in_progress: number;
  completed: number;
}

export interface NetworkConfig {
  id: number;
  username: string;
  ip: string;
  gateway: string;
  subnet: string;
  description: string;
  created_at: string;
}
