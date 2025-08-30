type OptionType = { value: string; label: string };

interface SelectProps {
  options: OptionType[];
  value?: OptionType | null;
  placeholder?: string;
  onChange: (value: OptionType | null) => void;
  className?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  value = null,
  placeholder = "Select",
  onChange,
  className = "",
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = options.find((o) => o.value === e.target.value) || null;
    onChange(selected);
  };

  return (
    <select
      value={value?.value || ""}
      onChange={handleChange}
      className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 ${className}`}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
