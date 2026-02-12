-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS public.answers CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.invites CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Profiles table for user display names
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Game rooms table
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Our Game',
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rooms_select_participants" ON public.rooms FOR SELECT 
  USING (auth.uid() = creator_id OR auth.uid() = partner_id);
CREATE POLICY "rooms_insert_creator" ON public.rooms FOR INSERT 
  WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "rooms_update_participants" ON public.rooms FOR UPDATE 
  USING (auth.uid() = creator_id OR auth.uid() = partner_id);
CREATE POLICY "rooms_delete_creator" ON public.rooms FOR DELETE 
  USING (auth.uid() = creator_id);

-- Invites table
CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites_select_own" ON public.invites FOR SELECT 
  USING (auth.uid() = inviter_id OR invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
CREATE POLICY "invites_insert_own" ON public.invites FOR INSERT 
  WITH CHECK (auth.uid() = inviter_id);
CREATE POLICY "invites_update_recipient" ON public.invites FOR UPDATE 
  USING (invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
CREATE POLICY "invites_delete_own" ON public.invites FOR DELETE 
  USING (auth.uid() = inviter_id);

-- Questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questions_select_room_participants" ON public.questions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms 
      WHERE rooms.id = questions.room_id 
      AND (rooms.creator_id = auth.uid() OR rooms.partner_id = auth.uid())
    )
  );
CREATE POLICY "questions_insert_author" ON public.questions FOR INSERT 
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "questions_update_author" ON public.questions FOR UPDATE 
  USING (auth.uid() = author_id);
CREATE POLICY "questions_delete_author" ON public.questions FOR DELETE 
  USING (auth.uid() = author_id);

-- Answers table for tracking responses during gameplay
CREATE TABLE public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(question_id, user_id)
);

ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "answers_select_room" ON public.answers FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms 
      WHERE rooms.id = answers.room_id 
      AND (rooms.creator_id = auth.uid() OR rooms.partner_id = auth.uid())
    )
  );
CREATE POLICY "answers_insert_own" ON public.answers FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for game tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.answers;
