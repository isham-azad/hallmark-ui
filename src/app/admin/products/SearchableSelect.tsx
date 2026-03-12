"use client";

import { useState, useRef, useEffect } from "react";

export interface SearchableSelectOption {
    id: string;
    name: string;
}

interface SearchableSelectProps {
    options: SearchableSelectOption[];
    value: string;
    onChange: (id: string) => void;
    placeholder?: string;
    id: string;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Search...",
    id,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const selected = options.find((o) => o.id === value);
    const filtered = options.filter((o) =>
        o.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (option: SearchableSelectOption) => {
        onChange(option.id);
        setSearchQuery("");
        setIsOpen(false);
    };

    return (
        <div className="searchable-select-wrap" ref={containerRef}>
            <button
                type="button"
                className={`searchable-select-trigger ${isOpen ? "is-open" : ""}`}
                onClick={() => {
                    setIsOpen((o) => !o);
                    if (!isOpen) setSearchQuery("");
                }}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-label={id === "brand" ? "Select brand" : "Select category"}
            >
                <span className="searchable-select-trigger-left">
                    <i className="bi bi-search searchable-select-trigger-icon"></i>
                    <span className={selected ? "searchable-select-value" : "searchable-select-placeholder"}>
                        {selected ? selected.name : placeholder}
                    </span>
                </span>
                <i className={`bi bi-chevron-down searchable-select-arrow ${isOpen ? "open" : ""}`}></i>
            </button>
            {isOpen && (
                <div className="searchable-select-dropdown" role="listbox">
                    <div className="searchable-select-search-header">Type to search</div>
                    <div className="searchable-select-search-wrap">
                        <i className="bi bi-search searchable-select-search-icon"></i>
                        <input
                            type="text"
                            className="searchable-select-search-input"
                            placeholder={id === "brand" ? "Search brands..." : "Search categories..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    </div>
                    <ul className="searchable-select-options">
                        {filtered.length === 0 ? (
                            <li className="searchable-select-option empty">No matches found</li>
                        ) : (
                            filtered.map((option) => (
                                <li
                                    key={option.id}
                                    role="option"
                                    aria-selected={option.id === value}
                                    className={`searchable-select-option ${option.id === value ? "selected" : ""}`}
                                    onClick={() => handleSelect(option)}
                                >
                                    {option.name}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
            <style jsx global>{`
                .searchable-select-wrap {
                    position: relative;
                    width: 100%;
                }
                .searchable-select-trigger {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    background: #fff;
                    font-size: 0.9375rem;
                    text-align: left;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.5rem;
                    min-height: 48px;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .searchable-select-trigger:hover {
                    border-color: #cbd5e1;
                    background: #f8fafc;
                }
                .searchable-select-trigger:focus {
                    outline: none;
                    border-color: #ffc451;
                    box-shadow: 0 0 0 3px rgba(255, 196, 81, 0.2);
                }
                .searchable-select-trigger.is-open {
                    border-color: #ffc451;
                    box-shadow: 0 0 0 3px rgba(255, 196, 81, 0.2);
                    background: #fff;
                }
                .searchable-select-trigger-left {
                    display: flex;
                    align-items: center;
                    gap: 0.625rem;
                    flex: 1;
                    min-width: 0;
                }
                .searchable-select-trigger-icon {
                    color: #94a3b8;
                    font-size: 1rem;
                    flex-shrink: 0;
                }
                .searchable-select-value {
                    color: #0f172a;
                    font-weight: 500;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .searchable-select-placeholder {
                    color: #94a3b8;
                }
                .searchable-select-arrow {
                    color: #64748b;
                    font-size: 0.875rem;
                    flex-shrink: 0;
                    transition: transform 0.2s;
                }
                .searchable-select-arrow.open {
                    transform: rotate(180deg);
                }
                .searchable-select-dropdown {
                    position: absolute;
                    top: calc(100% + 6px);
                    left: 0;
                    right: 0;
                    background: #fff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 10px 20px -5px rgba(0, 0, 0, 0.08);
                    z-index: 100;
                    overflow: hidden;
                }
                .searchable-select-search-header {
                    padding: 0.5rem 1rem 0;
                    font-size: 0.6875rem;
                    font-weight: 600;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .searchable-select-search-wrap {
                    padding: 0.5rem 0.75rem 0.75rem;
                    position: relative;
                    background: #f8fafc;
                    border-bottom: 1px solid #e2e8f0;
                }
                .searchable-select-search-icon {
                    position: absolute;
                    left: 1.125rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94a3b8;
                    font-size: 1rem;
                    pointer-events: none;
                }
                .searchable-select-search-input {
                    width: 100%;
                    padding: 0.625rem 0.875rem 0.625rem 2.5rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    font-size: 0.9375rem;
                    background: #fff;
                }
                .searchable-select-search-input:focus {
                    outline: none;
                    border-color: #ffc451;
                    box-shadow: 0 0 0 2px rgba(255, 196, 81, 0.15);
                }
                .searchable-select-search-input::placeholder {
                    color: #94a3b8;
                }
                .searchable-select-options {
                    max-height: 220px;
                    overflow-y: auto;
                    padding: 0.5rem;
                    list-style: none;
                    margin: 0;
                }
                .searchable-select-option {
                    padding: 0.75rem 1rem;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 0.9375rem;
                    color: #0f172a;
                    transition: background 0.15s;
                }
                .searchable-select-option:hover {
                    background: #f1f5f9;
                }
                .searchable-select-option.selected {
                    background: #fef3c7;
                    color: #92400e;
                    font-weight: 600;
                }
                .searchable-select-option.empty {
                    color: #94a3b8;
                    cursor: default;
                    padding: 1rem;
                    text-align: center;
                    font-size: 0.875rem;
                }
            `}</style>
        </div>
    );
}
