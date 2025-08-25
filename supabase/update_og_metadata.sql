-- Update Open Graph metadata for the root path with values from the admin panel
UPDATE og_metadata 
SET 
  title = 'Defeat the Dragon',
  description = 'A pixel-art, ad-free, Pomodoro-style Focus RPG PWA that gamifies productivity',
  keywords = 'focus, productivity, pomodoro, rpg, game, pixel art, dragon, gamification',
  og_title = 'Defeat the Dragon',
  og_description = 'A Pixel-art Pomodoro-style Focus RPG where you train to defeat the dragon through focused work sessions',
  og_image_url = '/opengraph-image',
  twitter_title = 'Defeat the Dragon',
  twitter_description = 'A Pixel-art Pomodoro-style Focus RPG where you train to defeat the dragon through focused work sessions',
  twitter_image_url = '/twitter-image',
  twitter_card_type = 'summary_large_image',
  updated_at = NOW()
WHERE page_path = '/';

-- If no record exists, insert one
INSERT INTO og_metadata (
  page_path,
  title,
  description,
  keywords,
  og_title,
  og_description,
  og_image_url,
  twitter_title,
  twitter_description,
  twitter_image_url,
  twitter_card_type
) 
SELECT 
  '/',
  'Defeat the Dragon',
  'A pixel-art, ad-free, Pomodoro-style Focus RPG PWA that gamifies productivity',
  'focus, productivity, pomodoro, rpg, game, pixel art, dragon, gamification',
  'Defeat the Dragon',
  'A Pixel-art Pomodoro-style Focus RPG where you train to defeat the dragon through focused work sessions',
  '/opengraph-image',
  'Defeat the Dragon',
  'A Pixel-art Pomodoro-style Focus RPG where you train to defeat the dragon through focused work sessions',
  '/twitter-image',
  'summary_large_image'
WHERE NOT EXISTS (
  SELECT 1 FROM og_metadata WHERE page_path = '/'
);
