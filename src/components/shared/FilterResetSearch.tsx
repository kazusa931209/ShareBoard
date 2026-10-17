import { Button } from "@/components/ui";

type FilterResetSearchProps = {
  onReset: () => void;
  onSearch: () => void;
};

export function FilterResetSearch({ onReset, onSearch }: FilterResetSearchProps) {
  return (
    <div className="board-filter-item board-filter-actions">
      <span
        className="board-filter-label board-filter-label--spacer"
        aria-hidden="true"
      >
        &nbsp;
      </span>
      <div className="board-filter-actions-row">
        <Button type="button" className="btn-ghost" onClick={onReset}>
          Reset
        </Button>
        <Button type="button" onClick={onSearch}>Search</Button>
      </div>
    </div>
  );
}
