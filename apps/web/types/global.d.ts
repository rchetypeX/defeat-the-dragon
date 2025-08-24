declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (eventName: string, handler: (...args: any[]) => void) => void;
      removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
    };
    coinbaseWalletExtension?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (eventName: string, handler: (...args: any[]) => void) => void;
      removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
    };
    phantom?: {
      ethereum?: {
        request: (args: { method: string; params?: any[] }) => Promise<any>;
        on: (eventName: string, handler: (...args: any[]) => void) => void;
        removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
      };
    };
    trustwallet?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (eventName: string, handler: (...args: any[]) => void) => void;
      removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
    };
  }
}

export {};
