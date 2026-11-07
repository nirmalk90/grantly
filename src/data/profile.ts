import type { Category, Gender, Level } from '../types';

export const LEVELS: readonly Level[] = ['UG', 'PG', 'Diploma'];
export const CATEGORIES: readonly Category[] = ['All', 'General', 'SC', 'ST', 'OBC', 'EWS'];
export const GENDERS: readonly Gender[] = ['F', 'M', 'Other'];

export const CATEGORY_LABELS: Record<Category, string> = {
  All: 'Any / not specified',
  General: 'General',
  SC: 'SC',
  ST: 'ST',
  OBC: 'OBC',
  EWS: 'EWS',
};

export const GENDER_LABELS: Record<Gender, string> = {
  F: 'Female',
  M: 'Male',
  Other: 'Other / prefer not to say',
};

export const STATES: readonly string[] = [
  'Andhra Pradesh',
  'Bihar',
  'Delhi',
  'Gujarat',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'West Bengal',
  'Other',
];

export const PROFILE_LIMITS = {
  nameMaxLength: 60,
  interestsMaxLength: 140,
  incomeMin: 0,
  incomeMax: 50_000_000,
  marksMin: 0,
  marksMax: 100,
} as const;
