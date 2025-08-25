-- Create table for managing Open Graph metadata
CREATE TABLE IF NOT EXISTS og_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_path VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  keywords VARCHAR(500),
  og_title VARCHAR(255),
  og_description TEXT,
  og_image_url VARCHAR(500),
  twitter_title VARCHAR(255),
  twitter_description TEXT,
  twitter_image_url VARCHAR(500),
  twitter_card_type VARCHAR(50) DEFAULT 'summary_large_image',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_og_metadata_page_path ON og_metadata(page_path);

-- Enable RLS
ALTER TABLE og_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies (allow public read, admin write)
CREATE POLICY "Public can view og metadata" ON og_metadata
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage og metadata" ON og_metadata
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert default metadata for the home page
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
) VALUES (
  '/',
  'Defeat the Dragon',
  'A pixel-art, ad-free, Pomodoro-style Focus RPG PWA that gamifies productivity',
  'focus, productivity, pomodoro, rpg, game, pixel art, dragon, gamification',
  'Defeat the Dragon',
  'A Pixel-art Pomodoro-style Focus RPG where you train to defeat the dragon through focused work sessions',
  'https://dtd.rchetype.xyz/opengraph-image',
  'Defeat the Dragon',
  'A Pixel-art Pomodoro-style Focus RPG where you train to defeat the dragon through focused work sessions',
  'https://dtd.rchetype.xyz/twitter-image',
  'summary_large_image'
) ON CONFLICT (page_path) DO NOTHING;

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_og_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at timestamp
CREATE TRIGGER trigger_update_og_metadata_updated_at
  BEFORE UPDATE ON og_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_og_metadata_updated_at();
