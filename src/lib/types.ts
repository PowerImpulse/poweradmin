import { Timestamp } from 'firebase/firestore';

interface Usuario {
  uid: string;
  email: string;
  username: string;
  role: string;
  isBlocked: boolean;
  created_at?: Timestamp;
  infoUser: {
    email: string;
    username: string;
  };
}

interface Asistencia {
  uid: string;
  userId: string;
  description: string;
  startTime: Timestamp;
  endTime: Timestamp;
  imageUrl: string;
  startLatitude: number;
  startLongitude: number;
  startLocation: string;
  endImageUrl: string;
  endLatitude: number;
  endLongitude: number;
  endLocation: string;
  username?: string;
  email?: string;
  createdAt?: Timestamp;
  startImagePath: string;
  endImagePath: string;
  formattedStartTime?: string;
  formattedEndTime?: string;
  infoEntrada: {
    imageUrl: string;
    startLatitude: number;
    startLongitude: number;
    startLocation: string;
  };
  infoSalida: {
    endImageUrl: string;
    endLatitude: number;
    endLongitude: number;
    endLocation: string;
  };
}

interface Equipo {
  capacidad_500: string;
  created_at?: Timestamp;
  empresa_501: string;
  grupo: string;
  inactivo: boolean;
  marca_500: string;
  modelo_500: string;
  no_serie_500: string;
  ref_ubic: string;
  tipo_de_equipo_500: string;
}

export type { Usuario, Asistencia, Equipo };