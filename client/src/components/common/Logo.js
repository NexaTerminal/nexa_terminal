import React from 'react';

const Logo = ({ size = 'default', className = '', ...props }) => {
  const sizes = {
    small: { height: '24px' },
    default: { height: '32px' },
    medium: { height: '48px' },
    large: { height: '64px' },
    xlarge: { height: '80px' }
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