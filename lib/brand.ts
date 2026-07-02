/** Central brand constants for the platform. */
export const BRAND = {
  name: 'لمّة',
  latin: 'Lamma',
  tagline: 'منصة ألعابكم الجماعية',
  description:
    'لمّة — منصة عربية لاكتشاف وإنشاء ولعب الألعاب الجماعية: فاميلي فيود، سباق الحروف، والمزيد. مع وضع العرض على التلفاز، لوحات الصدارة، ومجتمع صُنّاع.',
} as const;

/** Human label + emoji per game type, used across the UI. */
export const GAME_TYPES = {
  family_feud: { label: 'فاميلي فيود', short: 'فيود', emoji: '👨‍👩‍👧‍👦' },
  word_builder: { label: 'سباق الحروف', short: 'حروف', emoji: '🔤' },
  quiz: { label: 'كويز سريع', short: 'كويز', emoji: '⚡' },
  photo_guess: { label: 'من صاحب الصورة', short: 'صورة', emoji: '📸' },
  letter_hive: { label: 'خلية الحروف', short: 'خلية', emoji: '🐝' },
} as const;

export type GameTypeKey = keyof typeof GAME_TYPES;

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب',
};
