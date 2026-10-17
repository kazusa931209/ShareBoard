export function commitPageInput(
  pageInput: string,
  currentPage: number,
  goToPage: (page: number) => void,
  setPageInput: (value: string) => void,
): void {
  const n = Number.parseInt(pageInput, 10);
  if (Number.isFinite(n)) {
    goToPage(n);
  } else {
    setPageInput(String(currentPage));
  }
}
