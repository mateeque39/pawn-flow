-- Seed initial data for user_roles and users tables
-- This migration inserts necessary system users and roles

-- Insert user roles (if not already present)
INSERT INTO public.user_roles (id, role_name) VALUES
(1, 'admin'),
(2, 'manager'),
(3, 'clerk'),
(4, 'user'),
(6, 'staff')
ON CONFLICT (id) DO NOTHING;

-- Insert default users for testing/demo
-- Note: Passwords are hashed with bcrypt
-- Default users:
-- Username: Qasim, Password: (hashed)
-- Username: sakina, Password: (hashed)
INSERT INTO public.users (id, username, password, role_id, created_at) VALUES
(1, 'Qasim', '$2b$10$pSTbpia/XhfOcobg1QiDjeqOONLU/jBO5kQlqOiy0gdES3Q/KH1DG', 1, '2025-11-16 04:34:19.799627'),
(2, 'sakina', '$2b$10$Rq7HkdQ2TzeAYzHMAsW7ZulmW3u8EfiIuFWrhlTEDYL0AWIAxHgvi', 1, '2025-11-16 04:36:34.501602'),
(3, 'alesterhook@gmail.com', '$2b$10$O9znPqF4v8sFzzVa6DYSuCpb6A4KMo8/vMi5PS0xa0ReVN15gmAK', 4, '2025-11-16 04:37:10.636968'),
(9, 'user1_admin', '$2b$10$65VMIJw6nCdbebpd3tI1SuEioX708vyq33Y6ntPolQRxUuqWJcVB.', 1, '2025-11-24 05:03:21.045736'),
(12, 'user2_manager', '$2b$10$eMaIXCi17a14uhlhXAOC..Fjp/LiqnCEE.iEx.RoJVIVwt1bb./8.', 1, '2025-11-24 05:06:16.770334'),
(13, 'user3_clerk', '$2b$10$u8iJ.r3CGQRKSSDe8M.RaeiSvjDc.qV1N7Q09ZkTpc8z9Tl6t.LF6', 1, '2025-11-24 05:07:36.567323')
ON CONFLICT (id) DO NOTHING;

-- Note: ON CONFLICT DO NOTHING ensures idempotency - safe to run multiple times
