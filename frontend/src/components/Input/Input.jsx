import React from 'react';
import './Input.css';

const Input = ({ type = 'text', placeholder, value, onChange, label }) => {
  return (
    <div className="input-container">
      {label && <label className="input__label">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="input"
      />
    </div>
  );
};

export default Input;