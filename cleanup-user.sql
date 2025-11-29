-- Script to manually delete a user by Discord ID
-- Run this in your PostgreSQL database to remove the conflicting user

-- Step 1: Find the user with the conflicting Discord ID
-- Replace '307835414318809100' with the actual Discord ID if different
SELECT id, username, discord_id, created_at
FROM users
WHERE discord_id = '307835414318809100';

-- Step 2: Check if this user has any matches (optional, for safety)
-- Uncomment to see matches before deletion
/*
SELECT
  m.id as match_id,
  m.winner_id,
  m.loser_id,
  m.played_at,
  w.username as winner_username,
  l.username as loser_username
FROM matches m
JOIN users w ON m.winner_id = w.id
JOIN users l ON m.loser_id = l.id
WHERE m.winner_id = (SELECT id FROM users WHERE discord_id = '307835414318809100')
   OR m.loser_id = (SELECT id FROM users WHERE discord_id = '307835414318809100')
ORDER BY m.played_at;
*/

-- Step 3: Delete the user (this will cascade to matches due to foreign key constraints)
-- CAUTION: This will permanently delete the user and all their matches!
DELETE FROM users
WHERE discord_id = '307835414318809100';

-- Step 4: Verify deletion
SELECT COUNT(*) as remaining_users
FROM users
WHERE discord_id = '307835414318809100';

-- Step 5: If you want to see all current users and their Discord IDs (optional)
-- Uncomment to list all users
/*
SELECT
  id,
  username,
  discord_id,
  twitch_name,
  rating,
  wins,
  losses,
  created_at
FROM users
ORDER BY username;
*/
