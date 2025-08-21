import { z } from 'zod';
export declare const LootRarity: z.ZodEnum<["C", "U", "R", "SR", "SSR"]>;
export type LootRarity = z.infer<typeof LootRarity>;
export declare const LootType: z.ZodEnum<["cosmetic", "pet", "trinket"]>;
export type LootType = z.infer<typeof LootType>;
export interface LootItem {
    sku: string;
    name: string;
    rarity: LootRarity;
    type: LootType;
    classLock?: string;
    minLevel: number;
}
export declare class LootRNG {
    private seed;
    constructor(sessionId: string);
    private next;
    rollRarity(sessionMinutes: number, playerClass?: string): LootRarity;
    rollItem(rarity: LootRarity, availableItems: LootItem[]): LootItem | null;
}
export declare const SAMPLE_LOOT_ITEMS: LootItem[];
export declare const rollLoot: (sessionId: string, sessionMinutes: number, playerLevel: number, playerClass?: string) => LootItem | null;
