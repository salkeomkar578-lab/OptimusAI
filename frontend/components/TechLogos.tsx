"use client";

import React from "react";

export function OptimusLogo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="optGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="24" fill="#0f172a" stroke="url(#optGrad)" strokeWidth="3" />
      <polygon points="50,22 78,38 78,70 50,86 22,70 22,38" stroke="url(#optGrad)" strokeWidth="4" fill="none" filter="url(#neonGlow)" />
      <circle cx="50" cy="54" r="14" fill="url(#optGrad)" />
      <path d="M50 32 L50 44 M70 45 L60 51 M70 63 L60 57 M50 76 L50 64 M30 63 L40 57 M30 45 L40 51" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function PythonLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.91 2C6.72 2 7.03 4.25 7.03 4.25L7.04 6.59H12.06V7.37H4.37C4.37 7.37 2 7.1 2 12.28C2 17.47 4.09 17.21 4.09 17.21H5.66V15.01C5.66 12.44 7.85 12.51 7.85 12.51H12.87C14.75 12.51 16.32 10.94 16.32 9.06V4.34C16.32 4.34 16.66 2 11.91 2ZM9.56 3.47C10.05 3.47 10.45 3.87 10.45 4.36C10.45 4.85 10.05 5.25 9.56 5.25C9.07 5.25 8.67 4.85 8.67 4.36C8.67 3.87 9.07 3.47 9.56 3.47Z" fill="#3776AB"/>
      <path d="M12.09 22C17.28 22 16.97 19.75 16.97 19.75L16.96 17.41H11.94V16.63H19.63C19.63 16.63 22 16.9 22 11.72C22 6.53 19.91 6.79 19.91 6.79H18.34V8.99C18.34 11.56 16.15 11.49 16.15 11.49H11.13C9.25 11.49 7.68 13.06 7.68 14.94V19.66C7.68 19.66 7.34 22 12.09 22ZM14.44 20.53C13.95 20.53 13.55 20.13 13.55 19.64C13.55 19.15 13.95 18.75 14.44 18.75C14.93 18.75 15.33 19.15 15.33 19.64C15.33 20.13 14.93 20.53 14.44 20.53Z" fill="#FFD43B"/>
    </svg>
  );
}

export function FastAPILogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#009688"/>
      <path d="M12 4L7 13H11L10 20L17 11H12.5L14 4H12Z" fill="white"/>
    </svg>
  );
}

export function PostgreSQLLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="#336791"/>
      <path d="M8 8C9.5 7 14.5 7 16 8C17 9 17 12 16.5 13.5C16 15 14.5 16.5 12 17C10 16.5 8 15 8 13.5V8Z" stroke="white" strokeWidth="1.5" fill="none"/>
      <circle cx="10" cy="10" r="1" fill="white"/>
      <circle cx="14" cy="10" r="1" fill="white"/>
    </svg>
  );
}

export function SupabaseLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.4 2.8C13.2 2.3 12.5 2.1 12 2.5L3.8 9.3C3.3 9.7 3.5 10.5 4.1 10.6L12.2 12.1L10.6 21.2C10.5 21.7 11.2 21.9 11.6 21.5L20.2 13.7C20.7 13.3 20.4 12.5 19.8 12.4L11.8 11.1L13.4 2.8Z" fill="#3ECF8E"/>
    </svg>
  );
}

export function DockerLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="10" width="2" height="2" fill="#2496ED" rx="0.5"/>
      <rect x="10" y="10" width="2" height="2" fill="#2496ED" rx="0.5"/>
      <rect x="13" y="10" width="2" height="2" fill="#2496ED" rx="0.5"/>
      <rect x="10" y="7" width="2" height="2" fill="#2496ED" rx="0.5"/>
      <rect x="13" y="7" width="2" height="2" fill="#2496ED" rx="0.5"/>
      <rect x="16" y="10" width="2" height="2" fill="#2496ED" rx="0.5"/>
      <path d="M22 13C21.5 12 20 12 19 12.5C18.5 12.8 18 13.2 17.5 13C16.8 12.8 16.5 12 16 11.5L16 13H3C3 17 6 19 11 19C16 19 20 17 22 13Z" fill="#2496ED"/>
    </svg>
  );
}

export function RedisLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L2 8L12 13L22 8L12 3Z" fill="#DC382D"/>
      <path d="M2 13L12 18L22 13" stroke="#DC382D" strokeWidth="2" fill="none"/>
      <path d="M2 17L12 22L22 17" stroke="#DC382D" strokeWidth="2" fill="none"/>
    </svg>
  );
}

export function NextjsLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#000000" stroke="#333" strokeWidth="1"/>
      <path d="M8 7V17M8 7L17 17M17 7V13" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
