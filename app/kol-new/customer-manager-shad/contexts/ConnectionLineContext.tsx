import { createContext, RefObject } from 'react';

export interface ButtonPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ConnectionLineContextType {
  registerButton: (key: string, ref: RefObject<HTMLButtonElement | null>) => void;
  unregisterButton: (key: string) => void;
  buttonPositions: Record<string, ButtonPosition>;
}

export const ConnectionLineContext = createContext<ConnectionLineContextType | null>(null); 