import React from 'react';

interface BrandLogoProps {
  collapsed?: boolean;
  light?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ collapsed = false, light = false }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {/* Geometric Plate / Letter R Icon */}
      <div
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          backgroundColor: '#344C3D', // Forest Green
          border: '1.5px solid #C5A46D', // Muted Gold accent
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F7F4ED" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Minimal plate ring */}
          <circle cx="12" cy="12" r="9" stroke="#C5A46D" strokeWidth="1.5" strokeDasharray="3 3" />
          {/* Stylized Modern Letter R */}
          <path d="M8 6h5a3.5 3.5 0 0 1 0 7H8V6z" />
          <path d="M12.5 13L16 18" />
        </svg>
      </div>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontFamily: 'var(--font-family)',
              fontSize: '1.125rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: light ? '#FFFFFF' : '#252522',
              lineHeight: 1.1,
            }}
          >
            RENATO
          </span>
          <span
            style={{
              fontFamily: 'var(--font-family)',
              fontSize: '0.675rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              color: '#C5A46D', // Muted Gold
              textTransform: 'uppercase',
            }}
          >
            Kitchen / Resto
          </span>
        </div>
      )}
    </div>
  );
};
