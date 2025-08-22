-- Add wallet_address column to players table
ALTER TABLE players ADD COLUMN wallet_address TEXT;

-- Create unique index on wallet_address to ensure one wallet per player
CREATE UNIQUE INDEX idx_players_wallet_address ON players(wallet_address) WHERE wallet_address IS NOT NULL;

-- Add check constraint to ensure wallet_address is lowercase
ALTER TABLE players ADD CONSTRAINT check_wallet_address_lowercase 
CHECK (wallet_address IS NULL OR wallet_address = LOWER(wallet_address));
