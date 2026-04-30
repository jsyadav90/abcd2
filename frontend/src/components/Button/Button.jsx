import React from 'react';
import './Button.css';

const Button = ({ children, variant = 'primary', size = 'md', onClick, disabled, type = 'button', ...props }) => {
  const className = `button button--${variant} button--${size}`;

  return (
    <button
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;