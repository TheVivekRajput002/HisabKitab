"use client"

import React, { useState } from 'react';
import { Keyboard, X } from 'lucide-react';

const KeyboardShortcutsHelp = () => {
    const [isOpen, setIsOpen] = useState(false);

    const shortcuts = [
        { key: 'Esc', description: 'Back / Cancel / Exit current screen' },
        { key: 'F8', description: 'Create Sales Invoice' },
        { key: 'Ctrl + A', description: 'Save' },
        { key: 'Alt + C', description: 'Create customer/item inline' },
        { key: 'Alt + D', description: 'Delete invoice' },
        { key: 'Alt + 2', description: 'Duplicate invoice' },
        { key: 'F12', description: 'Invoice settings' },
        { key: 'Alt + F2', description: 'Change invoice date' },
        { key: 'Ctrl + P', description: 'Print / PDF' },
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
                        <div className="p-6 max-h-96 overflow-y-auto">
                            <div className="space-y-3">
                                {shortcuts.map((shortcut, index) => (
                                    <div key={index} className="flex items-center justify-between py-2">
                                        <span className="text-gray-700">{shortcut.description}</span>
                                        <kbd className="px-3 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono text-gray-800 whitespace-nowrap">
                                            {shortcut.key}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
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
