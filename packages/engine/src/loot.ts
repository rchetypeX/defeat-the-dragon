import { z } from 'zod';

export const LootRarity = z.enum(['C', 'U', 'R', 'SR', 'SSR']);
export type LootRarity = z.infer<typeof LootRarity>;

export const LootType = z.enum(['cosmetic', 'pet', 'trinket']);
export type LootType = z.infer<typeof LootType>;

export interface LootItem {
  sku: string;
  name: string;
  rarity: LootRarity;
  type: LootType;
  classLock?: string;
  minLevel: number;
}

// Base loot table percentages
const BASE_LOOT_TABLE: Record<LootRarity, number> = {
  C: 55,    // Common: 55% trinket
  U: 25,    // Uncommon: 25% décor
  R: 12,    // Rare: 12% skin fragment
  SR: 6,    // Super Rare: 6% pet egg shard
  SSR: 2,   // Ultra Rare: 2% pet
};

// Deterministic PRNG using session ID as seed
export class LootRNG {
  private seed: number;

  constructor(sessionId: string) {
    // Simple hash function for session ID
    this.seed = sessionId.split('').reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff;
    }, 0);
  }

  private next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  // Roll for loot rarity based on session duration and class bias
  rollRarity(sessionMinutes: number, playerClass?: string): LootRarity {
    const rarityIncrease = Math.min(sessionMinutes / 25 * 0.05, 0.25); // +1-5% per 25 minutes, max 25%
    
    // Class bias: +10% for class-aligned actions
    const classBias = playerClass ? 0.10 : 0;
    
    const roll = this.next();
    let cumulative = 0;
    
    // Adjust probabilities with rarity increase and class bias
    const adjustedTable = { ...BASE_LOOT_TABLE };
    if (classBias > 0) {
      // Boost higher rarities for class-aligned actions
      adjustedTable.R += classBias * 0.3;
      adjustedTable.SR += classBias * 0.4;
      adjustedTable.SSR += classBias * 0.3;
      // Reduce common to maintain 100% total
      adjustedTable.C -= classBias;
    }
    
    // Apply session duration bonus
    adjustedTable.U += rarityIncrease * 0.3;
    adjustedTable.R += rarityIncrease * 0.4;
    adjustedTable.SR += rarityIncrease * 0.2;
    adjustedTable.SSR += rarityIncrease * 0.1;
    adjustedTable.C -= rarityIncrease;
    
    // Normalize to ensure total = 100
    const total = Object.values(adjustedTable).reduce((sum, val) => sum + val, 0);
    Object.keys(adjustedTable).forEach(key => {
      adjustedTable[key as LootRarity] = adjustedTable[key as LootRarity] / total * 100;
    });
    
    // Determine rarity based on roll
    for (const [rarity, percentage] of Object.entries(adjustedTable)) {
      cumulative += percentage;
      if (roll <= cumulative / 100) {
        return rarity as LootRarity;
      }
    }
    
    return 'C'; // Fallback to common
  }

  // Roll for specific item within rarity tier
  rollItem(rarity: LootRarity, availableItems: LootItem[]): LootItem | null {
    const itemsInRarity = availableItems.filter(item => item.rarity === rarity);
    if (itemsInRarity.length === 0) return null;
    
    const roll = this.next();
    const index = Math.floor(roll * itemsInRarity.length);
    return itemsInRarity[index];
  }
}

// Sample loot items (would be loaded from database in production)
export const SAMPLE_LOOT_ITEMS: LootItem[] = [
  // Common items
  { sku: 'trinket_01', name: 'Lucky Coin', rarity: 'C', type: 'trinket', minLevel: 1 },
  { sku: 'trinket_02', name: 'Focus Crystal', rarity: 'C', type: 'trinket', minLevel: 1 },
  { sku: 'trinket_03', name: 'Study Stone', rarity: 'C', type: 'trinket', minLevel: 1 },
  
  // Uncommon items
  { sku: 'decor_01', name: 'Scholar\'s Lamp', rarity: 'U', type: 'cosmetic', minLevel: 1 },
  { sku: 'decor_02', name: 'Focus Fountain', rarity: 'U', type: 'cosmetic', minLevel: 1 },
  { sku: 'decor_03', name: 'Wisdom Tree', rarity: 'U', type: 'cosmetic', minLevel: 1 },
  
  // Rare items
  { sku: 'skin_frag_01', name: 'Hero\'s Cape Fragment', rarity: 'R', type: 'cosmetic', minLevel: 1 },
  { sku: 'skin_frag_02', name: 'Mage\'s Robe Fragment', rarity: 'R', type: 'cosmetic', minLevel: 1 },
  { sku: 'skin_frag_03', name: 'Warrior\'s Armor Fragment', rarity: 'R', type: 'cosmetic', minLevel: 1 },
  
  // Super Rare items
  { sku: 'pet_shard_01', name: 'Dragon Egg Shard', rarity: 'SR', type: 'pet', minLevel: 1 },
  { sku: 'pet_shard_02', name: 'Phoenix Egg Shard', rarity: 'SR', type: 'pet', minLevel: 1 },
  { sku: 'pet_shard_03', name: 'Unicorn Egg Shard', rarity: 'SR', type: 'pet', minLevel: 1 },
  
  // Ultra Rare items
  { sku: 'pet_01', name: 'Mini Dragon', rarity: 'SSR', type: 'pet', minLevel: 1 },
  { sku: 'pet_02', name: 'Phoenix Companion', rarity: 'SSR', type: 'pet', minLevel: 1 },
  { sku: 'pet_03', name: 'Unicorn Friend', rarity: 'SSR', type: 'pet', minLevel: 1 },
];

// Main loot roll function
export const rollLoot = (
  sessionId: string,
  sessionMinutes: number,
  playerLevel: number,
  playerClass?: string
): LootItem | null => {
  const rng = new LootRNG(sessionId);
  const rarity = rng.rollRarity(sessionMinutes, playerClass);
  
  // Filter items by player level
  const availableItems = SAMPLE_LOOT_ITEMS.filter(item => item.minLevel <= playerLevel);
  
  return rng.rollItem(rarity, availableItems);
};
