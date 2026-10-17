import type { ReactNode } from "react";

type FilterToolbarProps = {
  children: ReactNode;
  trailing?: ReactNode;
};

export function FilterToolbar({ children, trailing }: FilterToolbarProps) {
  return (
    <section className="studio-card board-toolbar">
      <div className="board-filters-bar">
        <div className="board-filters">{children}</div>
        {trailing}
      </div>
    </section>
  );
}
