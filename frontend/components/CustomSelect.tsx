"use client";

import { useState, useRef, useEffect } from "react";

export interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: readonly string[];
  className?: string;
}

export default function CustomSelect({ value, onChange, options, className = "" }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative w-full text-sm font-body ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-[rgba(0,0,0,0.2)] border border-border rounded-xl px-[18px] py-[14px] text-text hover:border-[rgba(240,196,61,0.3)] focus:outline-none focus:ring-[4px] focus:ring-[rgba(240,196,61,0.1)] focus:border-[rgba(240,196,61,0.5)] focus:bg-[rgba(240,196,61,0.02)] transition-all ease-in-out duration-200"
      >
        <span>{value}</span>
        <svg 
          className={`w-4 h-4 text-sub transition-transform duration-200 ${open ? "rotate-180" : ""}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul className="absolute z-[100] top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl overflow-hidden shadow-2xl py-1 max-h-60 overflow-y-auto backdrop-blur-xl">
          {options.map((opt) => (
            <li
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`px-[18px] py-3 cursor-pointer transition-colors ${
                value === opt 
                  ? "bg-gold/10 text-gold font-medium" 
                  : "text-sub hover:text-text hover:bg-gold/5"
              }`}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
