export const TRAVELER_AVATARS = [
  { key: 'fox', name: '夜行狐', mark: '狐' },
  { key: 'deer', name: '远行鹿', mark: '鹿' },
  { key: 'bird', name: '候鸟', mark: '鸟' },
  { key: 'cat', name: '屋檐猫', mark: '猫' },
  { key: 'moth', name: '灯下蛾', mark: '蛾' },
  { key: 'hare', name: '月野兔', mark: '兔' },
] as const;
export type AvatarKey = (typeof TRAVELER_AVATARS)[number]['key'];
export function isBundledAvatar(value: string): value is AvatarKey { return TRAVELER_AVATARS.some(({ key }) => key === value); }
