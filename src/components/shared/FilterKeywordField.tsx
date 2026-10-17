type FilterKeywordFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
};

export function FilterKeywordField({
  value,
  onChange,
  placeholder = "Search…",
  label = "Keyword",
}: FilterKeywordFieldProps) {
  return (
    <label className="board-filter-item">
      <span className="board-filter-label">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
