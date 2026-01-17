"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Custom hook for global keyboard shortcuts
 * @param {Object} shortcuts - Object mapping key combinations to handlers
 */
export const useKeyboardShortcuts = (shortcuts = {}) => {
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Build the key combination string
            const key = e.key.toLowerCase();
            const ctrl = e.ctrlKey;
            const alt = e.altKey;
            const shift = e.shiftKey;

            // Create combination string
            let combination = '';
            if (ctrl) combination += 'ctrl+';
            if (alt) combination += 'alt+';
            if (shift) combination += 'shift+';
            combination += key;

            // Handle function keys separately
            if (e.key.startsWith('F')) {
                combination = e.key.toLowerCase();
            }

            // Check if we have a handler for this combination
            const handler = shortcuts[combination];
            if (handler) {
                e.preventDefault();
                handler(e, router);
            }

            // Global shortcuts (always active)
            switch (combination) {
                case 'escape':
                    if (!shortcuts['escape']) {
                        router.back();
                    }
                    break;
                case 'f8':
                    if (!shortcuts['f8']) {
                        e.preventDefault();
                        router.push('/billing/add/invoice');
                    }
                    break;
                case 'ctrl+p':
                    // Let browser handle print by default unless overridden
                    if (shortcuts['ctrl+p']) {
                        e.preventDefault();
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts, router]);
};

/**
 * Helper to get shortcut display text
 */
export const getShortcutText = (shortcut) => {
    const parts = shortcut.split('+');
    return parts.map(part => {
        switch (part) {
            case 'ctrl': return 'Ctrl';
            case 'alt': return 'Alt';
            case 'shift': return 'Shift';
            default: return part.toUpperCase();
        }
    }).join(' + ');
};

export default useKeyboardShortcuts;
