export function toggleNavCollapsed(navState) {
  if (!navState) {
    return
  }
  navState.value = !navState.value
}
