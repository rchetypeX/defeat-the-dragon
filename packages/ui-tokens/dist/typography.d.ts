export declare const typography: {
    readonly fonts: {
        readonly primary: "\"Press Start 2P\", \"Courier New\", monospace";
        readonly dyslexia: {
            readonly primary: "\"OpenDyslexic\", \"Arial\", sans-serif";
            readonly secondary: "\"Comic Sans MS\", \"Arial\", sans-serif";
            readonly tertiary: "\"Verdana\", \"Arial\", sans-serif";
        };
        readonly fallback: {
            readonly sans: "\"Arial\", \"Helvetica\", sans-serif";
            readonly serif: "\"Times New Roman\", \"Georgia\", serif";
            readonly mono: "\"Courier New\", \"Monaco\", monospace";
        };
    };
    readonly fontSizes: {
        readonly xs: "12px";
        readonly sm: "14px";
        readonly base: "16px";
        readonly lg: "18px";
        readonly xl: "20px";
        readonly '2xl': "24px";
        readonly '3xl': "30px";
        readonly '4xl': "36px";
        readonly '5xl': "48px";
        readonly '6xl': "60px";
        readonly pixel: {
            readonly tiny: "8px";
            readonly small: "12px";
            readonly medium: "16px";
            readonly large: "24px";
            readonly huge: "32px";
        };
    };
    readonly fontWeights: {
        readonly thin: 100;
        readonly light: 300;
        readonly normal: 400;
        readonly medium: 500;
        readonly semibold: 600;
        readonly bold: 700;
        readonly extrabold: 800;
        readonly black: 900;
    };
    readonly lineHeights: {
        readonly none: 1;
        readonly tight: 1.25;
        readonly snug: 1.375;
        readonly normal: 1.5;
        readonly relaxed: 1.625;
        readonly loose: 2;
        readonly dyslexia: {
            readonly tight: 1.5;
            readonly normal: 1.75;
            readonly relaxed: 2;
            readonly loose: 2.5;
        };
    };
    readonly letterSpacing: {
        readonly tighter: "-0.05em";
        readonly tight: "-0.025em";
        readonly normal: "0em";
        readonly wide: "0.025em";
        readonly wider: "0.05em";
        readonly widest: "0.1em";
        readonly dyslexia: {
            readonly normal: "0.1em";
            readonly wide: "0.15em";
            readonly wider: "0.2em";
        };
    };
    readonly textStyles: {
        readonly h1: {
            readonly fontSize: "2.25rem";
            readonly fontWeight: 700;
            readonly lineHeight: 1.2;
            readonly letterSpacing: "-0.025em";
        };
        readonly h2: {
            readonly fontSize: "1.875rem";
            readonly fontWeight: 600;
            readonly lineHeight: 1.3;
            readonly letterSpacing: "-0.025em";
        };
        readonly h3: {
            readonly fontSize: "1.5rem";
            readonly fontWeight: 600;
            readonly lineHeight: 1.4;
            readonly letterSpacing: "-0.025em";
        };
        readonly h4: {
            readonly fontSize: "1.25rem";
            readonly fontWeight: 600;
            readonly lineHeight: 1.4;
            readonly letterSpacing: "-0.025em";
        };
        readonly body: {
            readonly fontSize: "1rem";
            readonly fontWeight: 400;
            readonly lineHeight: 1.6;
            readonly letterSpacing: "0em";
        };
        readonly bodyLarge: {
            readonly fontSize: "1.125rem";
            readonly fontWeight: 400;
            readonly lineHeight: 1.6;
            readonly letterSpacing: "0em";
        };
        readonly button: {
            readonly fontSize: "0.875rem";
            readonly fontWeight: 500;
            readonly lineHeight: 1.4;
            readonly letterSpacing: "0.025em";
        };
        readonly caption: {
            readonly fontSize: "0.75rem";
            readonly fontWeight: 400;
            readonly lineHeight: 1.5;
            readonly letterSpacing: "0.025em";
        };
        readonly pixel: {
            readonly title: {
                readonly fontSize: "1.5rem";
                readonly fontWeight: 700;
                readonly lineHeight: 1.2;
                readonly letterSpacing: "0.05em";
                readonly fontFamily: "\"Press Start 2P\", monospace";
            };
            readonly dialogue: {
                readonly fontSize: "1rem";
                readonly fontWeight: 400;
                readonly lineHeight: 1.5;
                readonly letterSpacing: "0.025em";
                readonly fontFamily: "\"Press Start 2P\", monospace";
            };
            readonly ui: {
                readonly fontSize: "0.875rem";
                readonly fontWeight: 500;
                readonly lineHeight: 1.4;
                readonly letterSpacing: "0.025em";
                readonly fontFamily: "\"Press Start 2P\", monospace";
            };
        };
        readonly dyslexia: {
            readonly body: {
                readonly fontSize: "1.125rem";
                readonly fontWeight: 400;
                readonly lineHeight: 1.75;
                readonly letterSpacing: "0.1em";
                readonly fontFamily: "\"OpenDyslexic\", \"Arial\", sans-serif";
            };
            readonly heading: {
                readonly fontSize: "1.5rem";
                readonly fontWeight: 600;
                readonly lineHeight: 1.5;
                readonly letterSpacing: "0.1em";
                readonly fontFamily: "\"OpenDyslexic\", \"Arial\", sans-serif";
            };
        };
    };
};
export declare const getDyslexiaTypography: (baseStyle: keyof typeof typography.textStyles) => {
    readonly fontSize: "2.25rem";
    readonly fontWeight: 700;
    readonly lineHeight: 1.2;
    readonly letterSpacing: "-0.025em";
} | {
    readonly fontSize: "1.875rem";
    readonly fontWeight: 600;
    readonly lineHeight: 1.3;
    readonly letterSpacing: "-0.025em";
} | {
    readonly fontSize: "1.5rem";
    readonly fontWeight: 600;
    readonly lineHeight: 1.4;
    readonly letterSpacing: "-0.025em";
} | {
    readonly fontSize: "1.25rem";
    readonly fontWeight: 600;
    readonly lineHeight: 1.4;
    readonly letterSpacing: "-0.025em";
} | {
    readonly fontSize: "1rem";
    readonly fontWeight: 400;
    readonly lineHeight: 1.6;
    readonly letterSpacing: "0em";
} | {
    readonly fontSize: "1.125rem";
    readonly fontWeight: 400;
    readonly lineHeight: 1.6;
    readonly letterSpacing: "0em";
} | {
    readonly fontSize: "0.875rem";
    readonly fontWeight: 500;
    readonly lineHeight: 1.4;
    readonly letterSpacing: "0.025em";
} | {
    readonly fontSize: "0.75rem";
    readonly fontWeight: 400;
    readonly lineHeight: 1.5;
    readonly letterSpacing: "0.025em";
} | {
    readonly title: {
        readonly fontSize: "1.5rem";
        readonly fontWeight: 700;
        readonly lineHeight: 1.2;
        readonly letterSpacing: "0.05em";
        readonly fontFamily: "\"Press Start 2P\", monospace";
    };
    readonly dialogue: {
        readonly fontSize: "1rem";
        readonly fontWeight: 400;
        readonly lineHeight: 1.5;
        readonly letterSpacing: "0.025em";
        readonly fontFamily: "\"Press Start 2P\", monospace";
    };
    readonly ui: {
        readonly fontSize: "0.875rem";
        readonly fontWeight: 500;
        readonly lineHeight: 1.4;
        readonly letterSpacing: "0.025em";
        readonly fontFamily: "\"Press Start 2P\", monospace";
    };
} | {
    readonly body: {
        readonly fontSize: "1.125rem";
        readonly fontWeight: 400;
        readonly lineHeight: 1.75;
        readonly letterSpacing: "0.1em";
        readonly fontFamily: "\"OpenDyslexic\", \"Arial\", sans-serif";
    };
    readonly heading: {
        readonly fontSize: "1.5rem";
        readonly fontWeight: 600;
        readonly lineHeight: 1.5;
        readonly letterSpacing: "0.1em";
        readonly fontFamily: "\"OpenDyslexic\", \"Arial\", sans-serif";
    };
} | {
    fontSize: "1.125rem";
    fontWeight: 400;
    lineHeight: 1.75;
    letterSpacing: "0.1em";
    fontFamily: "\"OpenDyslexic\", \"Arial\", sans-serif";
} | {
    fontSize: "1.5rem";
    fontWeight: 600;
    lineHeight: 1.5;
    letterSpacing: "0.1em";
    fontFamily: "\"OpenDyslexic\", \"Arial\", sans-serif";
};
