-- ============================================================================
-- seed.sql — realistic Arabic Family Feud sample content
-- Safe to run on a fresh database (supabase db reset). Idempotent on taxonomy.
-- Two demo users are created in auth.users; the handle_new_user trigger
-- provisions their profiles automatically, which we then enrich.
-- ============================================================================

-- Categories ----------------------------------------------------------------
insert into public.categories (slug, name, description, icon, color, position) values
  ('general',     'معلومات عامة', 'أسئلة متنوعة لكل العائلة',        'sparkles',  '#26e0a3', 1),
  ('family',      'العائلة',       'تحديات عائلية كلاسيكية',          'users',     '#4ea3ff', 2),
  ('food',        'طعام وشراب',    'كل ما يخص المطبخ والمائدة',       'utensils',  '#f59e0b', 3),
  ('sports',      'رياضة',         'أسئلة رياضية سريعة',              'trophy',    '#ef4444', 4),
  ('geography',   'حول العالم',    'دول، مدن، ومعالم',                'globe',     '#8b5cf6', 5),
  ('kids',        'أطفال',         'مناسب للصغار',                    'baby',      '#ec4899', 6)
on conflict (slug) do nothing;

-- Tags ----------------------------------------------------------------------
insert into public.tags (slug, name) values
  ('classic', 'كلاسيكي'), ('quick', 'سريع'), ('family-night', 'سهرة عائلية'),
  ('easy', 'سهل'), ('arabic', 'عربي')
on conflict (slug) do nothing;

-- Achievements --------------------------------------------------------------
insert into public.achievements (slug, name, description, icon, points) values
  ('first-game',     'أول لعبة',      'أنشأت أول لعبة لك',            'rocket', 10),
  ('first-publish',  'ناشر',          'نشرت لعبة للعامة',             'globe',  20),
  ('crowd-pleaser',  'محبوب الجمهور', 'لعبتك حصلت على 100 إعجاب',     'heart',  50),
  ('host-master',    'مقدّم محترف',    'استضفت 10 جلسات',             'mic',    40)
on conflict (slug) do nothing;

do $$
declare
  creator_id uuid := '11111111-1111-1111-1111-111111111111';
  player_id  uuid := '22222222-2222-2222-2222-222222222222';
  g1 uuid; g2 uuid;
  r uuid; q uuid;
begin
  -- Demo users (trigger auto-creates their profiles) ------------------------
  insert into auth.users (id, email, raw_user_meta_data) values
    (creator_id, 'noura@topfeud.gg', jsonb_build_object('display_name','عبدالله المبدع')),
    (player_id,  'salem@topfeud.gg',  jsonb_build_object('display_name','سالم اللاعب'))
  on conflict (id) do nothing;

  update public.profiles
    set handle = 'noura', display_name = 'عبدالله المبدع', role = 'creator',
        is_verified = true, bio = 'أصمم ألعاب فاميلي فيود لسهرات العائلة 🎉'
    where id = creator_id;
  update public.profiles
    set handle = 'salem', display_name = 'سالم اللاعب'
    where id = player_id;

  -- Game 1 ------------------------------------------------------------------
  insert into public.games (creator_id, slug, title, tagline, description, status, difficulty, language, estimated_minutes)
  values (creator_id, 'family-grand-challenge', 'تحدي العائلة الكبير',
          'سهرة لا تُنسى مع العائلة', 'لعبة فاميلي فيود كلاسيكية مليئة بالأسئلة اليومية الممتعة.',
          'published', 'medium', 'ar', 25)
  returning id into g1;

  -- Round 1
  insert into public.rounds (game_id, position, title, time_limit_seconds, points_multiplier)
  values (g1, 1, 'أشياء يومية', 60, 1) returning id into r;
  insert into public.questions (round_id, position, prompt) values (r, 1, 'اذكر شيئًا لا يخرج الناس من البيت بدونه') returning id into q;
  insert into public.answers (question_id, position, text, points) values
    (q,1,'الجوال',42),(q,2,'المفتاح',25),(q,3,'المحفظة',18),(q,4,'الساعة',9),(q,5,'النظارة',6);
  insert into public.questions (round_id, position, prompt) values (r, 2, 'شيء تجده في كل غرفة نوم') returning id into q;
  insert into public.answers (question_id, position, text, points) values
    (q,1,'السرير',40),(q,2,'الخزانة',27),(q,3,'المرآة',15),(q,4,'الإضاءة',12),(q,5,'الستائر',6);

  -- Round 2
  insert into public.rounds (game_id, position, title, time_limit_seconds, points_multiplier)
  values (g1, 2, 'المطبخ', 60, 2) returning id into r;
  insert into public.questions (round_id, position, prompt) values (r, 1, 'أكثر أداة تُستخدم في المطبخ') returning id into q;
  insert into public.answers (question_id, position, text, points) values
    (q,1,'السكين',35),(q,2,'الملعقة',28),(q,3,'القدر',20),(q,4,'المقلاة',10),(q,5,'الشوكة',7);
  insert into public.questions (round_id, position, prompt) values (r, 2, 'مشروب يُقدَّم للضيوف') returning id into q;
  insert into public.answers (question_id, position, text, points) values
    (q,1,'القهوة',45),(q,2,'الشاي',30),(q,3,'العصير',15),(q,4,'الماء',10);

  -- Game 2 ------------------------------------------------------------------
  insert into public.games (creator_id, slug, title, tagline, description, status, difficulty, language, estimated_minutes)
  values (creator_id, 'quick-knowledge-race', 'سباق المعلومات السريع',
          'فكّر بسرعة قبل الفريق الثاني', 'جولات سريعة تختبر بداهتك ومعلوماتك العامة.',
          'published', 'easy', 'ar', 15)
  returning id into g2;

  insert into public.rounds (game_id, position, title, time_limit_seconds, points_multiplier)
  values (g2, 1, 'حول العالم', 45, 1) returning id into r;
  insert into public.questions (round_id, position, prompt) values (r, 1, 'اذكر دولة عربية') returning id into q;
  insert into public.answers (question_id, position, text, points) values
    (q,1,'السعودية',30),(q,2,'مصر',25),(q,3,'الإمارات',20),(q,4,'المغرب',15),(q,5,'الكويت',10);
  insert into public.questions (round_id, position, prompt) values (r, 2, 'وسيلة مواصلات') returning id into q;
  insert into public.answers (question_id, position, text, points) values
    (q,1,'السيارة',38),(q,2,'الطائرة',27),(q,3,'الحافلة',18),(q,4,'القطار',12),(q,5,'الدراجة',5);

  insert into public.rounds (game_id, position, title, time_limit_seconds, points_multiplier)
  values (g2, 2, 'الطبيعة', 45, 2) returning id into r;
  insert into public.questions (round_id, position, prompt) values (r, 1, 'حيوان أليف') returning id into q;
  insert into public.answers (question_id, position, text, points) values
    (q,1,'القط',40),(q,2,'الكلب',35),(q,3,'العصفور',15),(q,4,'السمك',10);
  insert into public.questions (round_id, position, prompt) values (r, 2, 'فاكهة صيفية') returning id into q;
  insert into public.answers (question_id, position, text, points) values
    (q,1,'البطيخ',38),(q,2,'المانجو',25),(q,3,'العنب',20),(q,4,'التين',17);

  -- Taxonomy links ----------------------------------------------------------
  insert into public.game_categories (game_id, category_id)
    select g1, id from public.categories where slug in ('family','general')
  on conflict do nothing;
  insert into public.game_categories (game_id, category_id)
    select g2, id from public.categories where slug in ('general','geography')
  on conflict do nothing;
  insert into public.game_tags (game_id, tag_id)
    select g1, id from public.tags where slug in ('classic','family-night','arabic')
  on conflict do nothing;
  insert into public.game_tags (game_id, tag_id)
    select g2, id from public.tags where slug in ('quick','easy','arabic')
  on conflict do nothing;

  -- Sample engagement (exercises rating/favorite counter triggers) ----------
  insert into public.game_favorites (user_id, game_id) values (player_id, g1)
    on conflict do nothing;
  insert into public.game_ratings (user_id, game_id, rating, review)
    values (player_id, g1, 5, 'لعبة ممتعة جدًا للسهرات العائلية!')
  on conflict (user_id, game_id) do nothing;

  -- Award the creator their badges
  insert into public.user_achievements (user_id, achievement_id)
    select creator_id, id from public.achievements where slug in ('first-game','first-publish')
  on conflict do nothing;
end $$;
