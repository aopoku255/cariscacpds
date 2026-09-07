import type { SessionUser } from './api/types';

/**
 * What "finish your profile before registering" means — mirrors
 * `REQUIRED_PROFILE_FIELDS` in carisca-api's
 * src/core/users/profile-completeness.js. Name and email are already
 * required at signup; these are the fields signup leaves optional but a real
 * registration needs.
 */
export const REQUIRED_PROFILE_FIELDS: { key: keyof SessionUser; label: string }[] = [
  { key: 'phone', label: 'Phone number' },
  { key: 'countryCode', label: 'Country' },
  { key: 'gender', label: 'Gender' },
  { key: 'organization', label: 'Organization' },
  { key: 'jobTitle', label: 'Job title' },
  { key: 'positionId', label: 'Position' },
  { key: 'sectorId', label: 'Sector' },
];

export function isProfileComplete(user: SessionUser): boolean {
  return REQUIRED_PROFILE_FIELDS.every(({ key }) => {
    const value = user[key];
    return value !== null && value !== undefined && value !== '';
  });
}
