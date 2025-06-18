"use client";

import React, { useState, useCallback, useRef, RefObject, ReactNode } from 'react';
import { ConnectionLineContext, ButtonPosition } from './ConnectionLineContext';

interface Props {
    cardRef: RefObject<HTMLDivElement | null>;
    children: ReactNode;
}

export function ConnectionLineProvider({ cardRef, children }: Props) {
    const [buttonPositions, setButtonPositions] = useState<Record<string, ButtonPosition>>({});
    const buttonRefs = useRef<Record<string, RefObject<HTMLButtonElement>>>({});

    const updateAllButtonPositions = useCallback(() => {
        if (!cardRef.current) return;
        const cardRect = cardRef.current.getBoundingClientRect();
        const newPositions: Record<string, ButtonPosition> = {};

        Object.entries(buttonRefs.current).forEach(([key, ref]) => {
            if (ref.current) {
                const buttonRect = ref.current.getBoundingClientRect();
                newPositions[key] = {
                    x: buttonRect.left - cardRect.left + buttonRect.width / 2,
                    y: buttonRect.top - cardRect.top,
                    width: buttonRect.width,
                    height: buttonRect.height,
                };
            }
        });

        // Check if positions have actually changed to avoid infinite loops
        if (JSON.stringify(newPositions) !== JSON.stringify(buttonPositions)) {
            setButtonPositions(newPositions);
        }
    }, [cardRef, buttonPositions]);
    
    const registerButton = useCallback((key: string, ref: RefObject<HTMLButtonElement>) => {
        buttonRefs.current[key] = ref;
        // Schedule an update
        setTimeout(updateAllButtonPositions, 50);
    }, [updateAllButtonPositions]);

    const unregisterButton = useCallback((key: string) => {
        delete buttonRefs.current[key];
        // Schedule an update
        setTimeout(updateAllButtonPositions, 50);
    }, [updateAllButtonPositions]);

    // Use ResizeObserver to update positions on resize
    React.useEffect(() => {
        const observer = new ResizeObserver(() => {
            updateAllButtonPositions();
        });
        if (cardRef.current) {
            observer.observe(cardRef.current);
        }
        return () => observer.disconnect();
    }, [cardRef, updateAllButtonPositions]);

    // Initial position calculation
    React.useEffect(() => {
        setTimeout(updateAllButtonPositions, 100);
    },[updateAllButtonPositions])

    const value = {
        registerButton,
        unregisterButton,
        buttonPositions,
    };

    return (
        <ConnectionLineContext.Provider value={value}>
            {children}
        </ConnectionLineContext.Provider>
    );
} 