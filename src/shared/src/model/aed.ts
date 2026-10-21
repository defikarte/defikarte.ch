import { type Feature } from 'geojson';

export type AedAccess = 'yes' | 'permissive' | 'private';
export type AedIndoor = 'yes' | 'no';
// why an AED is permanently gone, the values are also the i18n keys of the reasons
export type AedRemovalReason = 'dismantled' | 'stolen' | 'destroyed' | 'incorrect';
export const AED_REMOVAL_REASONS: AedRemovalReason[] = [
  'dismantled',
  'stolen',
  'destroyed',
  'incorrect',
];

export interface AedRemovalData {
  reason: AedRemovalReason | '';
  comment?: string;
  reporter: string;
}

export interface AedData {
  id?: string;
  reporter: string;
  location: string;
  level?: string;
  description?: string;
  openingHours?: string; // Opening hours of the AED location
  operator?: string; // Name of the organization or person responsible for the AED
  operatorPhone?: string; // Contact phone number for the operator
  operatorEmail?: string; // Contact e-mail-address for the operator
  access?: AedAccess;
  indoor?: AedIndoor;
  latitude: number;
  longitude: number;
  source?: string; // Source of the data, e.g., 'local_knowledge, defikarte.ch'
  sourceFeature?: Feature; // original feature with eventually additional data
}
