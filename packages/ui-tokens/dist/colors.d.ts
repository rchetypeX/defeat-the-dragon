export declare const colors: {
    readonly primary: {
        readonly 50: "#fff7ed";
        readonly 100: "#ffedd5";
        readonly 200: "#fed7aa";
        readonly 300: "#fdba74";
        readonly 400: "#fb923c";
        readonly 500: "#f2751a";
        readonly 600: "#ea580c";
        readonly 700: "#c2410c";
        readonly 800: "#9a3412";
        readonly 900: "#7c2d12";
    };
    readonly secondary: {
        readonly 50: "#f0fdf4";
        readonly 100: "#dcfce7";
        readonly 200: "#bbf7d0";
        readonly 300: "#86efac";
        readonly 400: "#4ade80";
        readonly 500: "#22c55e";
        readonly 600: "#16a34a";
        readonly 700: "#15803d";
        readonly 800: "#166534";
        readonly 900: "#14532d";
    };
    readonly success: {
        readonly 50: "#f0fdf4";
        readonly 100: "#dcfce7";
        readonly 200: "#bbf7d0";
        readonly 300: "#86efac";
        readonly 400: "#4ade80";
        readonly 500: "#22c55e";
        readonly 600: "#16a34a";
        readonly 700: "#15803d";
        readonly 800: "#166534";
        readonly 900: "#14532d";
    };
    readonly warning: {
        readonly 50: "#fffbeb";
        readonly 100: "#fef3c7";
        readonly 200: "#fde68a";
        readonly 300: "#fcd34d";
        readonly 400: "#fbbf24";
        readonly 500: "#f59e0b";
        readonly 600: "#d97706";
        readonly 700: "#b45309";
        readonly 800: "#92400e";
        readonly 900: "#78350f";
    };
    readonly error: {
        readonly 50: "#fef2f2";
        readonly 100: "#fee2e2";
        readonly 200: "#fecaca";
        readonly 300: "#fca5a5";
        readonly 400: "#f87171";
        readonly 500: "#ef4444";
        readonly 600: "#dc2626";
        readonly 700: "#b91c1c";
        readonly 800: "#991b1b";
        readonly 900: "#7f1d1d";
    };
    readonly gray: {
        readonly 50: "#f9fafb";
        readonly 100: "#f3f4f6";
        readonly 200: "#e5e7eb";
        readonly 300: "#d1d5db";
        readonly 400: "#9ca3af";
        readonly 500: "#6b7280";
        readonly 600: "#4b5563";
        readonly 700: "#374151";
        readonly 800: "#1f2937";
        readonly 900: "#111827";
    };
    readonly pixel: {
        readonly skin: "#ffdbac";
        readonly hair: "#8b4513";
        readonly armor: "#8B4513";
        readonly weapon: "#C0C0C0";
        readonly shield: "#8B4513";
        readonly grass: "#228B22";
        readonly dirt: "#8B4513";
        readonly tree: "#228B22";
        readonly treeTrunk: "#654321";
        readonly hut: "#8B4513";
        readonly ui: {
            readonly background: "#228B22";
            readonly surface: "#8B4513";
            readonly border: "#654321";
            readonly text: "#ffffff";
            readonly textSecondary: "#fbbf24";
            readonly button: "#f2751a";
            readonly healthBar: "#ef4444";
        };
    };
    readonly highContrast: {
        readonly background: "#000000";
        readonly surface: "#1a1a1a";
        readonly text: "#ffffff";
        readonly textSecondary: "#cccccc";
        readonly border: "#ffffff";
        readonly primary: "#ffff00";
        readonly secondary: "#00ffff";
        readonly success: "#00ff00";
        readonly warning: "#ffaa00";
        readonly error: "#ff0000";
    };
};
export declare const getContrastColor: (backgroundColor: string) => string;
export declare const getAccessibleTextColor: (backgroundColor: string, highContrast?: boolean) => string;
