import React from 'react';
import './Select.css';

const Select = ({ name, value, onChange, options, disabled, placeholder }) => {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="select"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options?.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;