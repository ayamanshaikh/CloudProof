import { Mission } from '../types';
import { s3LeakyBucketMission } from './s3LeakyBucket';
import { sgDoorOpenMission } from './sgDoorOpen';
import { iamTooMuchPowerMission } from './iamTooMuchPower';

export const MISSIONS: Mission[] = [
  s3LeakyBucketMission,
  sgDoorOpenMission,
  iamTooMuchPowerMission,
];

export function getAllMissions(): Mission[] {
  return MISSIONS;
}

export function getMissionById(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}

export function getMissionBySlug(slug: string): Mission | undefined {
  return MISSIONS.find((m) => m.slug === slug);
}
