import React from 'react';

const Logo = ({ size = 'default', className = '', ...props }) => {
  const sizes = {
    small: { height: '36px' }, /* Increased by 150% from 24px */
    default: { height: '48px' }, /* Increased by 150% from 32px */
    medium: { height: '72px' }, /* Increased by 150% from 48px */
    large: { height: '96px' }, /* Increased by 150% from 64px */
    xlarge: { height: '120px' } /* Increased by 150% from 80px */
  };

  const logoStyle = {
    ...sizes[size],
    width: 'auto',
    transition: 'all 0.3s ease',
  };

  return (
    <img 
      src="/nexa-logo-navbar.png" 
      alt="Nexa" 
      style={logoStyle}
      className={`nexa-logo ${className}`}
      {...props}
    />
  );
};

export default Logo;