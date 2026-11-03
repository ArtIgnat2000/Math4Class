export function canApplyUpdate({
  updateAvailable,
  route,
  dialogOpen,
  pendingStart,
  mobileOpen,
  updating,
  updateError,
}: {
  updateAvailable: boolean;
  route: string;
  dialogOpen: boolean;
  pendingStart: boolean;
  mobileOpen: boolean;
  updating: boolean;
  updateError: boolean;
}) {
  return (
    updateAvailable &&
    route !== 'lesson' &&
    !dialogOpen &&
    !pendingStart &&
    !mobileOpen &&
    !updating &&
    !updateError
  );
}
