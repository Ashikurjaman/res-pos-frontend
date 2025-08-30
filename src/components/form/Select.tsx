import { useState } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: OptionType[];
  value?: OptionType | null;
  placeholder?: string;
  onChange: (value: OptionType | null) => void;
  className?: string;
}

const Select: React.FC<SelectProps> = ({ options, value = null, placeholder = "Select", onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = options.find(o => o.value === e.target.value) || null;
    onChange(selected);
  };

  return (
    <select value={value?.value || ""} onChange={handleChange}>
      <option value="" disabled>{placeholder}</option>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );
};


export default Select;
