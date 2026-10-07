"use client"

import React, { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

const KeyboardShortcutsHelp = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleHelp = () => {
        // Don't hijack '?' while the user is typing in a field
        const el = document.activeElement;
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return false;
        setIsOpen(prev => !prev);
    };

    useKeyboardShortcuts(
        isOpen
            ? {
                escape: () => setIsOpen(false),
            }
            : {
                // '?' is typed with Shift on most layouts, so the hook reports 'shift+?'
                '?': toggleHelp,
                'shift+?': toggleHelp,
            }
    );

    // Only shortcuts that are actually implemented in the app
    const shortcutGroups = [
        {
            title: 'Global',
            shortcuts: [
                { key: 'Esc', description: 'Leave input field / Go back' },
            ],
        },
        {
            title: 'Create Invoice / Estimate',
            shortcuts: [
                { key: 'Ctrl + S', description: 'Save bill' },
                { key: 'Ctrl + P', description: 'Download PDF (after save) / Print' },
                { key: 'Ctrl + E', description: 'Edit saved bill / Focus customer name' },
                { key: 'Enter / →', description: 'Next field (adds new row at end)' },
            ],
        },
        {
            title: 'View Invoice / Estimate',
            shortcuts: [
                { key: 'Ctrl + E', description: 'Switch to edit mode' },
            ],
        },
    ];

    return (
        <>
            {/* Floating Help Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-40"
                title="Keyboard Shortcuts (?)">
                <Keyboard size={20} />
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <Keyboard className="text-blue-600" size={24} />
                                <h2 className="text-xl font-bold text-gray-900">Keyboard Shortcuts</h2>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Shortcuts List */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-5">
                            {shortcutGroups.map((group) => (
                                <section key={group.title}>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                        {group.title}
                                    </h3>
                                    <div className="space-y-1">
                                        {group.shortcuts.map((shortcut) => (
                                            <div key={shortcut.key + shortcut.description} className="flex items-center justify-between gap-4 py-1.5">
                                                <span className="text-gray-700 text-sm">{shortcut.description}</span>
                                                <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono text-gray-800 whitespace-nowrap">
                                                    {shortcut.key}
                                                </kbd>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-gray-50 rounded-b-xl">
                            <p className="text-xs text-gray-500 text-center">
                                Press <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs">?</kbd> anytime to view shortcuts
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default KeyboardShortcutsHelp;
