import type { Category, Gender, Level } from '../types';

export const LEVELS: readonly Level[] = ['UG', 'PG', 'Diploma'];
export const CATEGORIES: readonly Category[] = ['All', 'General', 'SC', 'ST', 'OBC', 'EWS', 'EBC', 'DNT'];
export const GENDERS: readonly Gender[] = ['Unspecified', 'F', 'M', 'Other'];
export const CATEGORY_LABELS: Record<Category, string> = {
  All: 'Not specified', General: 'General', SC: 'SC', ST: 'ST', OBC: 'OBC', EWS: 'EWS', EBC: 'EBC', DNT: 'DNT',
};
export const GENDER_LABELS: Record<Gender, string> = {
  Unspecified: 'Not specified', F: 'Female', M: 'Male', Other: 'Other / prefer not to say',
};
export const NER_STATES = ['Arunachal Pradesh', 'Assam', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Sikkim', 'Tripura'] as const;
export const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Jammu and Kashmir', 'Ladakh', 'Other',
] as const;
export const PROFILE_LIMITS = {
  nameMaxLength: 60, interestsMaxLength: 140, incomeMin: 0, incomeMax: 50_000_000, marksMin: 0, marksMax: 100,
} as const;
