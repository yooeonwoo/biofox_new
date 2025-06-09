import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ['class'],
    content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			'biofox-purple': '#6D28D9',
  			'biofox-purple-light': '#C0A6E3',
  			'dark-gray-1': '#383B44',
  			'dark-gray-2': '#2E3035',
  			// Biofox Monday.com 스타일 색상 팔레트
  			'biofox-blue-violet': '#6366F1',
  			'biofox-dark-blue-violet': '#4F46E5',
  			'biofox-lavender': '#A78BFA',
  			'soksok-light-blue': '#DBEAFE'
  		},
  		boxShadow: {
  			'aura': '0 0 15px rgba(192, 166, 227, 0.5)'
  		},
  		borderRadius: {
  			'brand': '8px'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
};

export default config; 