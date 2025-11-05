import type { SVGProps } from 'react';

export function MainInterfaceIllustration(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="478"
      height="852"
      viewBox="0 0 478 852"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="478" height="852" rx="48" fill="#F8FAFC" />

      {/* Search bar (ratio 1) */}
      <g transform="translate(32,78)">
        <rect
          x="0"
          y="0"
          width="414"
          height="60"
          rx="28"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="1.5"
        />
        <text
          x="26"
          y="37"
          fill="#94A3B8"
          fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontSize="18"
          letterSpacing="0.01em"
        >
          Search existing words
        </text>
        <rect x="336" y="10" width="52" height="40" rx="20" fill="#111827" />
        <text
          x="362"
          y="37"
          fill="#FFFFFF"
          fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontSize="26"
          textAnchor="middle"
        >
          +
        </text>
      </g>

      {/* Heat map (ratio 3) */}
      <g transform="translate(32,170)">
        <rect
          x="0"
          y="0"
          width="414"
          height="180"
          rx="32"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="1.5"
        />
        <text
          x="28"
          y="40"
          fill="#0F172A"
          fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontSize="22"
          letterSpacing="0.02em"
        >
          Study Heat Map
        </text>
        <text
          x="28"
          y="64"
          fill="#94A3B8"
          fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontSize="14"
        >
          Last 5 months · swipe left / right
        </text>

        {/* Month labels */}
        <g
          transform="translate(72,82)"
          fill="#94A3B8"
          fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontSize="12"
        >
          <text x="24" y="0" textAnchor="middle">
            Mar
          </text>
          <text x="84" y="0" textAnchor="middle">
            Apr
          </text>
          <text x="144" y="0" textAnchor="middle">
            May
          </text>
          <text x="204" y="0" textAnchor="middle">
            Jun
          </text>
          <text x="264" y="0" textAnchor="middle">
            Jul
          </text>
        </g>

        {/* Day labels (every other day) */}
        <g
          transform="translate(32,100)"
          fill="#CBD5E1"
          fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontSize="12"
        >
          <text x="0" y="12">
            Sun
          </text>
          <text x="0" y="36">
            Tue
          </text>
          <text x="0" y="60">
            Thu
          </text>
          <text x="0" y="84">
            Sat
          </text>
        </g>

        {/* Contribution grid */}
        <g transform="translate(72,92)">
          <g fill="#E2E8F0">
            {/* Column 0 */}
            <rect x="0" y="0" width="10" height="10" rx="4" />
            <rect x="0" y="12" width="10" height="10" rx="4" />
            <rect x="0" y="24" width="10" height="10" rx="4" />
            <rect x="0" y="36" width="10" height="10" rx="4" />
            <rect x="0" y="48" width="10" height="10" rx="4" />
            <rect x="0" y="60" width="10" height="10" rx="4" />
            <rect x="0" y="72" width="10" height="10" rx="4" />
            {/* Column 1 */}
            <rect x="12" y="0" width="10" height="10" rx="4" />
            <rect x="12" y="12" width="10" height="10" rx="4" />
            <rect x="12" y="24" width="10" height="10" rx="4" />
            <rect x="12" y="36" width="10" height="10" rx="4" />
            <rect x="12" y="48" width="10" height="10" rx="4" />
            <rect x="12" y="60" width="10" height="10" rx="4" />
            <rect x="12" y="72" width="10" height="10" rx="4" />
            {/* Column 2 */}
            <rect x="24" y="0" width="10" height="10" rx="4" />
            <rect x="24" y="12" width="10" height="10" rx="4" />
            <rect x="24" y="24" width="10" height="10" rx="4" />
            <rect x="24" y="36" width="10" height="10" rx="4" />
            <rect x="24" y="48" width="10" height="10" rx="4" />
            <rect x="24" y="60" width="10" height="10" rx="4" />
            <rect x="24" y="72" width="10" height="10" rx="4" />
            {/* Column 3 */}
            <rect x="36" y="0" width="10" height="10" rx="4" />
            <rect x="36" y="12" width="10" height="10" rx="4" />
            <rect x="36" y="24" width="10" height="10" rx="4" />
            <rect x="36" y="36" width="10" height="10" rx="4" />
            <rect x="36" y="48" width="10" height="10" rx="4" />
            <rect x="36" y="60" width="10" height="10" rx="4" />
            <rect x="36" y="72" width="10" height="10" rx="4" />
            {/* Column 4 */}
            <rect x="48" y="0" width="10" height="10" rx="4" />
            <rect x="48" y="12" width="10" height="10" rx="4" />
            <rect x="48" y="24" width="10" height="10" rx="4" />
            <rect x="48" y="36" width="10" height="10" rx="4" />
            <rect x="48" y="48" width="10" height="10" rx="4" />
            <rect x="48" y="60" width="10" height="10" rx="4" />
            <rect x="48" y="72" width="10" height="10" rx="4" />
            {/* Column 5 */}
            <rect x="60" y="0" width="10" height="10" rx="4" />
            <rect x="60" y="12" width="10" height="10" rx="4" />
            <rect x="60" y="24" width="10" height="10" rx="4" />
            <rect x="60" y="36" width="10" height="10" rx="4" />
            <rect x="60" y="48" width="10" height="10" rx="4" />
            <rect x="60" y="60" width="10" height="10" rx="4" />
            <rect x="60" y="72" width="10" height="10" rx="4" />
            {/* Column 6 */}
            <rect x="72" y="0" width="10" height="10" rx="4" />
            <rect x="72" y="12" width="10" height="10" rx="4" />
            <rect x="72" y="24" width="10" height="10" rx="4" />
            <rect x="72" y="36" width="10" height="10" rx="4" />
            <rect x="72" y="48" width="10" height="10" rx="4" />
            <rect x="72" y="60" width="10" height="10" rx="4" />
            <rect x="72" y="72" width="10" height="10" rx="4" />
            {/* Column 7 */}
            <rect x="84" y="0" width="10" height="10" rx="4" />
            <rect x="84" y="12" width="10" height="10" rx="4" />
            <rect x="84" y="24" width="10" height="10" rx="4" />
            <rect x="84" y="36" width="10" height="10" rx="4" />
            <rect x="84" y="48" width="10" height="10" rx="4" />
            <rect x="84" y="60" width="10" height="10" rx="4" />
            <rect x="84" y="72" width="10" height="10" rx="4" />
            {/* Column 8 */}
            <rect x="96" y="0" width="10" height="10" rx="4" />
            <rect x="96" y="12" width="10" height="10" rx="4" />
            <rect x="96" y="24" width="10" height="10" rx="4" />
            <rect x="96" y="36" width="10" height="10" rx="4" />
            <rect x="96" y="48" width="10" height="10" rx="4" />
            <rect x="96" y="60" width="10" height="10" rx="4" />
            <rect x="96" y="72" width="10" height="10" rx="4" />
            {/* Column 9 */}
            <rect x="108" y="0" width="10" height="10" rx="4" />
            <rect x="108" y="12" width="10" height="10" rx="4" />
            <rect x="108" y="24" width="10" height="10" rx="4" />
            <rect x="108" y="36" width="10" height="10" rx="4" />
            <rect x="108" y="48" width="10" height="10" rx="4" />
            <rect x="108" y="60" width="10" height="10" rx="4" />
            <rect x="108" y="72" width="10" height="10" rx="4" />
            {/* Column 10 */}
            <rect x="120" y="0" width="10" height="10" rx="4" />
            <rect x="120" y="12" width="10" height="10" rx="4" />
            <rect x="120" y="24" width="10" height="10" rx="4" />
            <rect x="120" y="36" width="10" height="10" rx="4" />
            <rect x="120" y="48" width="10" height="10" rx="4" />
            <rect x="120" y="60" width="10" height="10" rx="4" />
            <rect x="120" y="72" width="10" height="10" rx="4" />
            {/* Column 11 */}
            <rect x="132" y="0" width="10" height="10" rx="4" />
            <rect x="132" y="12" width="10" height="10" rx="4" />
            <rect x="132" y="24" width="10" height="10" rx="4" />
            <rect x="132" y="36" width="10" height="10" rx="4" />
            <rect x="132" y="48" width="10" height="10" rx="4" />
            <rect x="132" y="60" width="10" height="10" rx="4" />
            <rect x="132" y="72" width="10" height="10" rx="4" />
            {/* Column 12 */}
            <rect x="144" y="0" width="10" height="10" rx="4" />
            <rect x="144" y="12" width="10" height="10" rx="4" />
            <rect x="144" y="24" width="10" height="10" rx="4" />
            <rect x="144" y="36" width="10" height="10" rx="4" />
            <rect x="144" y="48" width="10" height="10" rx="4" />
            <rect x="144" y="60" width="10" height="10" rx="4" />
            <rect x="144" y="72" width="10" height="10" rx="4" />
            {/* Column 13 */}
            <rect x="156" y="0" width="10" height="10" rx="4" />
            <rect x="156" y="12" width="10" height="10" rx="4" />
            <rect x="156" y="24" width="10" height="10" rx="4" />
            <rect x="156" y="36" width="10" height="10" rx="4" />
            <rect x="156" y="48" width="10" height="10" rx="4" />
            <rect x="156" y="60" width="10" height="10" rx="4" />
            <rect x="156" y="72" width="10" height="10" rx="4" />
            {/* Column 14 */}
            <rect x="168" y="0" width="10" height="10" rx="4" />
            <rect x="168" y="12" width="10" height="10" rx="4" />
            <rect x="168" y="24" width="10" height="10" rx="4" />
            <rect x="168" y="36" width="10" height="10" rx="4" />
            <rect x="168" y="48" width="10" height="10" rx="4" />
            <rect x="168" y="60" width="10" height="10" rx="4" />
            <rect x="168" y="72" width="10" height="10" rx="4" />
            {/* Column 15 */}
            <rect x="180" y="0" width="10" height="10" rx="4" />
            <rect x="180" y="12" width="10" height="10" rx="4" />
            <rect x="180" y="24" width="10" height="10" rx="4" />
            <rect x="180" y="36" width="10" height="10" rx="4" />
            <rect x="180" y="48" width="10" height="10" rx="4" />
            <rect x="180" y="60" width="10" height="10" rx="4" />
            <rect x="180" y="72" width="10" height="10" rx="4" />
            {/* Column 16 */}
            <rect x="192" y="0" width="10" height="10" rx="4" />
            <rect x="192" y="12" width="10" height="10" rx="4" />
            <rect x="192" y="24" width="10" height="10" rx="4" />
            <rect x="192" y="36" width="10" height="10" rx="4" />
            <rect x="192" y="48" width="10" height="10" rx="4" />
            <rect x="192" y="60" width="10" height="10" rx="4" />
            <rect x="192" y="72" width="10" height="10" rx="4" />
            {/* Column 17 */}
            <rect x="204" y="0" width="10" height="10" rx="4" />
            <rect x="204" y="12" width="10" height="10" rx="4" />
            <rect x="204" y="24" width="10" height="10" rx="4" />
            <rect x="204" y="36" width="10" height="10" rx="4" />
            <rect x="204" y="48" width="10" height="10" rx="4" />
            <rect x="204" y="60" width="10" height="10" rx="4" />
            <rect x="204" y="72" width="10" height="10" rx="4" />
            {/* Column 18 */}
            <rect x="216" y="0" width="10" height="10" rx="4" />
            <rect x="216" y="12" width="10" height="10" rx="4" />
            <rect x="216" y="24" width="10" height="10" rx="4" />
            <rect x="216" y="36" width="10" height="10" rx="4" />
            <rect x="216" y="48" width="10" height="10" rx="4" />
            <rect x="216" y="60" width="10" height="10" rx="4" />
            <rect x="216" y="72" width="10" height="10" rx="4" />
            {/* Column 19 */}
            <rect x="228" y="0" width="10" height="10" rx="4" />
            <rect x="228" y="12" width="10" height="10" rx="4" />
            <rect x="228" y="24" width="10" height="10" rx="4" />
            <rect x="228" y="36" width="10" height="10" rx="4" />
            <rect x="228" y="48" width="10" height="10" rx="4" />
            <rect x="228" y="60" width="10" height="10" rx="4" />
            <rect x="228" y="72" width="10" height="10" rx="4" />
            {/* Column 20 */}
            <rect x="240" y="0" width="10" height="10" rx="4" />
            <rect x="240" y="12" width="10" height="10" rx="4" />
            <rect x="240" y="24" width="10" height="10" rx="4" />
            <rect x="240" y="36" width="10" height="10" rx="4" />
            <rect x="240" y="48" width="10" height="10" rx="4" />
            <rect x="240" y="60" width="10" height="10" rx="4" />
            <rect x="240" y="72" width="10" height="10" rx="4" />
            {/* Column 21 */}
            <rect x="252" y="0" width="10" height="10" rx="4" />
            <rect x="252" y="12" width="10" height="10" rx="4" />
            <rect x="252" y="24" width="10" height="10" rx="4" />
            <rect x="252" y="36" width="10" height="10" rx="4" />
            <rect x="252" y="48" width="10" height="10" rx="4" />
            <rect x="252" y="60" width="10" height="10" rx="4" />
            <rect x="252" y="72" width="10" height="10" rx="4" />
            {/* Column 22 */}
            <rect x="264" y="0" width="10" height="10" rx="4" />
            <rect x="264" y="12" width="10" height="10" rx="4" />
            <rect x="264" y="24" width="10" height="10" rx="4" />
            <rect x="264" y="36" width="10" height="10" rx="4" />
            <rect x="264" y="48" width="10" height="10" rx="4" />
            <rect x="264" y="60" width="10" height="10" rx="4" />
            <rect x="264" y="72" width="10" height="10" rx="4" />
            {/* Column 23 */}
            <rect x="276" y="0" width="10" height="10" rx="4" />
            <rect x="276" y="12" width="10" height="10" rx="4" />
            <rect x="276" y="24" width="10" height="10" rx="4" />
            <rect x="276" y="36" width="10" height="10" rx="4" />
            <rect x="276" y="48" width="10" height="10" rx="4" />
            <rect x="276" y="60" width="10" height="10" rx="4" />
            <rect x="276" y="72" width="10" height="10" rx="4" />
            {/* Column 24 */}
            <rect x="288" y="0" width="10" height="10" rx="4" />
            <rect x="288" y="12" width="10" height="10" rx="4" />
            <rect x="288" y="24" width="10" height="10" rx="4" />
            <rect x="288" y="36" width="10" height="10" rx="4" />
            <rect x="288" y="48" width="10" height="10" rx="4" />
            <rect x="288" y="60" width="10" height="10" rx="4" />
            <rect x="288" y="72" width="10" height="10" rx="4" />
          </g>

          {/* Activity highlights */}
          <g fill="#34D399">
            <rect x="12" y="36" width="10" height="10" rx="4" opacity="0.45" />
            <rect x="24" y="12" width="10" height="10" rx="4" opacity="0.75" />
            <rect x="36" y="72" width="10" height="10" rx="4" opacity="0.55" />
            <rect x="48" y="60" width="10" height="10" rx="4" opacity="0.7" />
            <rect x="60" y="24" width="10" height="10" rx="4" opacity="0.85" />
            <rect x="72" y="72" width="10" height="10" rx="4" opacity="0.4" />
            <rect x="84" y="60" width="10" height="10" rx="4" opacity="0.8" />
            <rect x="96" y="24" width="10" height="10" rx="4" opacity="0.6" />
            <rect x="108" y="12" width="10" height="10" rx="4" opacity="0.9" />
            <rect x="120" y="60" width="10" height="10" rx="4" opacity="0.7" />
            <rect x="132" y="72" width="10" height="10" rx="4" opacity="0.5" />
            <rect x="156" y="36" width="10" height="10" rx="4" opacity="0.6" />
            <rect x="168" y="60" width="10" height="10" rx="4" opacity="0.4" />
            <rect x="192" y="48" width="10" height="10" rx="4" opacity="0.5" />
            <rect x="216" y="24" width="10" height="10" rx="4" opacity="0.75" />
            <rect x="240" y="60" width="10" height="10" rx="4" opacity="0.55" />
            <rect x="264" y="36" width="10" height="10" rx="4" opacity="0.65" />
            <rect x="288" y="12" width="10" height="10" rx="4" opacity="0.5" />
          </g>
        </g>
      </g>

      {/* Word card (ratio 5) */}
      <g transform="translate(32,382)">
        <rect
          x="0"
          y="0"
          width="414"
          height="300"
          rx="36"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="1.5"
        />
        <text
          x="32"
          y="64"
          fill="#0F172A"
          fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontSize="28"
          fontWeight="600"
        >
          漢字
        </text>
        <text
          x="32"
          y="94"
          fill="#34D399"
          fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontSize="16"
          letterSpacing="0.08em"
        >
          かんじ · kanji
        </text>
        <rect x="32" y="120" width="350" height="64" rx="24" fill="#F1F5F9" />
        <text
          x="52"
          y="159"
          fill="#475569"
          fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontSize="15"
        >
          Context: Daily study habit tracker
        </text>
        <rect x="32" y="198" width="350" height="80" rx="28" fill="#ECFDF5" />
        <text
          x="52"
          y="236"
          fill="#166534"
          fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontSize="15"
        >
          Example: 今日の漢字カードを復習する。
        </text>
      </g>

      {/* Start Review button (ratio 1) */}
      <g transform="translate(110,714)">
        <rect x="0" y="0" width="258" height="60" rx="30" fill="#111827" />
        <text
          x="129"
          y="40"
          fill="#FFFFFF"
          fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          fontSize="22"
          fontWeight="600"
          textAnchor="middle"
        >
          Start Review
        </text>
      </g>
    </svg>
  );
}

