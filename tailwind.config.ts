import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          blue: '#0071e3',
          'link-blue': '#0066cc',
          'bright-blue': '#2997ff',
        },
        surface: {
          light: '#f5f5f7',
          'near-black': '#1d1d1f',
          'dark-1': '#272729',
          'dark-2': '#262628',
          'dark-3': '#28282a',
          'dark-4': '#2a2a2d',
          'dark-5': '#242426',
        },
        btn: {
          active: '#ededf2',
          'default-light': '#fafafc',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'SF Pro Display',
          'SF Pro Text',
          'SF Pro Icons',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        'display-hero': ['3.5rem', { lineHeight: '1.07', letterSpacing: '-0.28px', fontWeight: '600' }],
        'section-heading': ['2.5rem', { lineHeight: '1.10', letterSpacing: '0', fontWeight: '600' }],
        'tile-heading': ['1.75rem', { lineHeight: '1.14', letterSpacing: '0.196px', fontWeight: '400' }],
        'card-title': ['1.3125rem', { lineHeight: '1.19', letterSpacing: '0.231px', fontWeight: '700' }],
        'sub-heading': ['1.3125rem', { lineHeight: '1.19', letterSpacing: '0.231px', fontWeight: '400' }],
        'body': ['1.0625rem', { lineHeight: '1.47', letterSpacing: '-0.374px', fontWeight: '400' }],
        'body-emphasis': ['1.0625rem', { lineHeight: '1.24', letterSpacing: '-0.374px', fontWeight: '600' }],
        'btn-lg': ['1.125rem', { lineHeight: '1.00', letterSpacing: '0', fontWeight: '300' }],
        'btn': ['1.0625rem', { lineHeight: '2.41', letterSpacing: '0', fontWeight: '400' }],
        'link': ['0.875rem', { lineHeight: '1.43', letterSpacing: '-0.224px', fontWeight: '400' }],
        'caption': ['0.875rem', { lineHeight: '1.29', letterSpacing: '-0.224px', fontWeight: '400' }],
        'caption-bold': ['0.875rem', { lineHeight: '1.29', letterSpacing: '-0.224px', fontWeight: '600' }],
        'micro': ['0.75rem', { lineHeight: '1.33', letterSpacing: '-0.12px', fontWeight: '400' }],
        'micro-bold': ['0.75rem', { lineHeight: '1.33', letterSpacing: '-0.12px', fontWeight: '600' }],
        'nano': ['0.625rem', { lineHeight: '1.47', letterSpacing: '-0.08px', fontWeight: '400' }],
      },
      borderRadius: {
        'micro': '5px',
        'standard': '8px',
        'comfortable': '11px',
        'large': '12px',
        'pill': '980px',
      },
      boxShadow: {
        'card': 'rgba(0, 0, 0, 0.22) 3px 5px 30px 0px',
      },
      backdropBlur: {
        'nav': '20px',
      },
      backgroundImage: {
        'glass-nav': 'none',
      },
    },
  },
  plugins: [typography],
};

export default config;
