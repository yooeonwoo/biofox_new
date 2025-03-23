import React from 'react';

interface FoxLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function FoxLogo({ width = 48, height = 48, className = '' }: FoxLogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g filter="url(#filter0_d_1325_1442)">
        <path
          d="M38.4 12.8L33.6 6.4L28.8 8L24 4.8L19.2 8L14.4 6.4L9.6 12.8L11.2 19.2L8 25.6L12.8 33.6L24 43.2L35.2 33.6L40 25.6L36.8 19.2L38.4 12.8Z"
          fill="url(#paint0_linear_1325_1442)"
        />
        <path
          d="M24 27.2L21.6 24.798L18.4 20.8L15.2 24L12.8 20.8L15.2 15.2L19.2 12L24 14.4L28.8 12L32.8 15.2L35.2 20.8L32.8 24L29.6 20.8L26.4 24.8L24 27.2Z"
          fill="url(#paint1_linear_1325_1442)"
        />
        <path
          d="M21.6 30.4C21.6 28.8 20.8 27.2 20.8 27.2C20.8 27.2 18.4 30.4 18.4 32C18.4 33.6 19.2 35.2 20.8 35.2C22.4 35.2 23.2 33.6 23.2 32C23.2 31.2 22.4 30.4 21.6 30.4Z"
          fill="#C0C0C0"
        />
        <path
          d="M26.4 30.4C26.4 28.8 27.2 27.2 27.2 27.2C27.2 27.2 29.6 30.4 29.6 32C29.6 33.6 28.8 35.2 27.2 35.2C25.6 35.2 24.8 33.6 24.8 32C24.8 31.2 25.6 30.4 26.4 30.4Z"
          fill="#C0C0C0"
        />
      </g>
      <defs>
        <filter
          id="filter0_d_1325_1442"
          x="0"
          y="0"
          width="48"
          height="48"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="4" />
          <feGaussianBlur stdDeviation="2" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1325_1442" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_1325_1442"
            result="shape"
          />
        </filter>
        <linearGradient
          id="paint0_linear_1325_1442"
          x1="8"
          y1="4.8"
          x2="40"
          y2="43.2"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E0E0E0" />
          <stop offset="0.5" stopColor="#B3B3B3" />
          <stop offset="1" stopColor="#808080" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_1325_1442"
          x1="12.8"
          y1="12"
          x2="35.2"
          y2="27.2"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#D6D6D6" />
          <stop offset="1" stopColor="#A0A0A0" />
        </linearGradient>
      </defs>
    </svg>
  );
} 