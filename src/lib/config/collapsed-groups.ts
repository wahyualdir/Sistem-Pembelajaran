export interface CollapsibleNavGroup {
  id: string;
  defaultCollapsed?: boolean;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
}

export function getCollapsedGroupsStorageKey(normalizedRole: string): string {
  return `siajar_collapsed_groups_${normalizedRole}`;
}

/**
 * Builds the default collapsed-group map from navigation group metadata.
 */
export function buildInitialCollapsedGroups(
  groups: ReadonlyArray<CollapsibleNavGroup>
): Record<string, boolean> {
  const initial: Record<string, boolean> = {};
  for (const group of groups) {
    if (group.defaultCollapsed) {
      initial[group.id] = true;
    }
  }
  return initial;
}

/**
 * Safely reads persisted collapsed-group state from storage, ignoring
 * non-object payloads or corrupt JSON and preserving defaults for new groups.
 */
export function loadCollapsedGroupsState(
  normalizedRole: string,
  groups: ReadonlyArray<CollapsibleNavGroup>,
  storage?: KeyValueStorage | null
): Record<string, boolean> {
  const initial = buildInitialCollapsedGroups(groups);
  const store =
    storage !== undefined
      ? storage
      : typeof window !== 'undefined'
        ? window.localStorage
        : null;

  if (!store) {
    return initial;
  }

  try {
    const saved = store.getItem(getCollapsedGroupsStorageKey(normalizedRole));
    if (!saved) {
      return initial;
    }
    const parsed: unknown = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return initial;
    }
    const merged: Record<string, boolean> = { ...initial };
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'boolean') {
        merged[key] = value;
      }
    }
    return merged;
  } catch {
    return initial;
  }
}
