interface IconProps {
  className?: string;
}

function base(path: string, extra?: string) {
  return function Icon({ className }: IconProps) {
    return (
      <svg
        className={className ?? 'icon'}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d={path} />
        {extra !== undefined && <path d={extra} />}
      </svg>
    );
  };
}

export const GridIcon = base('M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z');
export const SearchIcon = base('M10.8 3.8a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z', 'm16 16 4.5 4.5');
export const SparkIcon = base('m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z', 'm19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z');
export const BookIcon = base('M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z', 'M4 16a2 2 0 0 1 2-2h14M8 7h7');
export const ClockIcon = base('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7v5l3 2');
export const FileIcon = base('M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z', 'M13 2v7h7M8 14h8M8 18h6');
export const ArrowIcon = base('M5 12h14', 'm13 6 6 6-6 6');
export const SendIcon = base('M22 2 11 13', 'M22 2 15 22l-4-9-9-4 20-7Z');
export const SunIcon = base('M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z', 'M12 1v2m0 18v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M1 12h2m18 0h2M4.2 19.8l1.4-1.4m12.8-12.8 1.4-1.4');
export const MoonIcon = base('M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z');
export const BellIcon = base('M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9', 'M10 21h4');
export const CheckIcon = base('m4 12.5 5 5L20 6.5');
export const CommandIcon = base('M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3Z');
