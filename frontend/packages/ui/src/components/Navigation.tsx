"use client";

import React, { useState } from "react";

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, defaultTab, onChange, className = "" }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || "");

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className={className}>
      <div className="flex border-b border-neutral-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && handleTabClick(tab.id)}
            className={[
              "px-4 py-2 text-sm font-medium transition-colors",
              "border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-brand-yellow text-brand-navy"
                : "border-transparent text-neutral-500 hover:text-neutral-700",
              tab.disabled && "cursor-not-allowed opacity-50",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="py-4">{activeContent}</div>
    </div>
  );
}

interface BreadcrumbProps {
  items: { label: string; href?: string }[];
  className?: string;
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-2 text-sm text-neutral-500">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && (
              <svg className="h-3 w-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            {item.href ? (
              <a
                href={item.href}
                className="text-neutral-500 hover:text-brand-navy transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <span className="font-medium text-brand-navy">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
