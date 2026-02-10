-- ============================================================
-- Seed Data: 3 quizzes with ~9 questions total
-- ============================================================

-- Quiz 1: Data Structures
insert into public.quizzes (id, title, description) values
  ('a1111111-1111-1111-1111-111111111111', 'Data Structures Fundamentals', 'Test your knowledge of arrays, trees, and graphs.');

insert into public.questions (quiz_id, question_text, score, time_required, difficulty, category) values
  ('a1111111-1111-1111-1111-111111111111', 'Explain the difference between a stack and a queue.', 10, 5, 'easy', 'Linear DS'),
  ('a1111111-1111-1111-1111-111111111111', 'What is the time complexity of searching in a balanced BST?', 20, 8, 'medium', 'Trees'),
  ('a1111111-1111-1111-1111-111111111111', 'Implement an adjacency list representation for a directed graph.', 35, 15, 'hard', 'Graphs');

-- Quiz 2: Algorithms
insert into public.quizzes (id, title, description) values
  ('b2222222-2222-2222-2222-222222222222', 'Algorithm Design & Analysis', 'Dynamic programming, greedy algorithms, and more.');

insert into public.questions (quiz_id, question_text, score, time_required, difficulty, category) values
  ('b2222222-2222-2222-2222-222222222222', 'Describe the greedy algorithm for activity selection.', 15, 6, 'easy', 'Greedy'),
  ('b2222222-2222-2222-2222-222222222222', 'Solve the 0/1 knapsack problem for given weights and values.', 30, 12, 'medium', 'DP'),
  ('b2222222-2222-2222-2222-222222222222', 'Prove the correctness of Dijkstra''s algorithm.', 40, 20, 'hard', 'Graph Algorithms');

-- Quiz 3: Web Development
insert into public.quizzes (id, title, description) values
  ('c3333333-3333-3333-3333-333333333333', 'Modern Web Development', 'React, Next.js, databases, and APIs.');

insert into public.questions (quiz_id, question_text, score, time_required, difficulty, category) values
  ('c3333333-3333-3333-3333-333333333333', 'What is the virtual DOM and why does React use it?', 10, 4, 'easy', 'React'),
  ('c3333333-3333-3333-3333-333333333333', 'Explain server-side rendering vs client-side rendering.', 20, 10, 'medium', 'Next.js'),
  ('c3333333-3333-3333-3333-333333333333', 'Design a normalized database schema for an e-commerce app.', 30, 18, 'hard', 'Databases');
