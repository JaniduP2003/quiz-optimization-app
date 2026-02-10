-- ============================================================
-- Quiz Optimization App — Supabase Schema
-- ============================================================

-- 1) Profiles (mirrors auth.users)
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 2) Quizzes
create table public.quizzes (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  created_at  timestamptz not null default now()
);

alter table public.quizzes enable row level security;

create policy "Quizzes are publicly readable"
  on public.quizzes for select
  using (true);

-- 3) Questions
create table public.questions (
  id            uuid primary key default gen_random_uuid(),
  quiz_id       uuid not null references public.quizzes(id) on delete cascade,
  question_text text not null,
  score         integer not null check (score >= 0),
  time_required integer not null check (time_required > 0),
  difficulty    text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  category      text,
  created_at    timestamptz not null default now()
);

create index idx_questions_quiz_id on public.questions(quiz_id);

alter table public.questions enable row level security;

create policy "Questions are publicly readable"
  on public.questions for select
  using (true);

-- 4) Attempts
create table public.attempts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  quiz_id          uuid not null references public.quizzes(id) on delete cascade,
  total_time_limit integer not null check (total_time_limit > 0),
  created_at       timestamptz not null default now()
);

create index idx_attempts_user_id on public.attempts(user_id);

alter table public.attempts enable row level security;

create policy "Users can insert own attempts"
  on public.attempts for insert
  with check (auth.uid() = user_id);

create policy "Users can view own attempts"
  on public.attempts for select
  using (auth.uid() = user_id);

-- 5) Answers
create table public.answers (
  id          uuid primary key default gen_random_uuid(),
  attempt_id  uuid not null references public.attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  answer_text text,
  created_at  timestamptz not null default now(),
  constraint uq_answer_attempt_question unique (attempt_id, question_id)
);

create index idx_answers_attempt_id on public.answers(attempt_id);

alter table public.answers enable row level security;

create policy "Users can insert answers to own attempts"
  on public.answers for insert
  with check (
    exists (
      select 1 from public.attempts
      where attempts.id = attempt_id
        and attempts.user_id = auth.uid()
    )
  );

create policy "Users can view answers to own attempts"
  on public.answers for select
  using (
    exists (
      select 1 from public.attempts
      where attempts.id = attempt_id
        and attempts.user_id = auth.uid()
    )
  );

-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
