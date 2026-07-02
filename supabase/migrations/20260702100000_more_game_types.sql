-- ============================================================================
-- 20260702100000_more_game_types
-- Adds three new game types to the platform:
--   * quiz         — "كويز سريع": timed multiple-choice trivia (solo, leaderboard)
--   * photo_guess  — "من صاحب الصورة": guess who/what is in the picture (MCQ + image)
--   * letter_hive  — "خلية الحروف": two teams claim hex cells by answering
--                    letter-questions; first to connect their sides wins.
-- Content for all three lives in games.config (jsonb), like word_builder.
-- ============================================================================

alter type public.game_type add value if not exists 'quiz';
alter type public.game_type add value if not exists 'photo_guess';
alter type public.game_type add value if not exists 'letter_hive';
