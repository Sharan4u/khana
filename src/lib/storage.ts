import { Group, Member } from "@/types/expense";

const GROUPS_KEY = "splitbite_groups";
const ACTIVE_GROUP_KEY = "splitbite_active_group";

const DEFAULT_MEMBERS: Member[] = [
  { name: "Member 1" },
  { name: "Member 2" },
  { name: "Member 3" },
  { name: "Member 4" },
];

export function loadGroups(): Group[] {
  try {
    const data = localStorage.getItem(GROUPS_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  // Migrate old data
  const oldExpenses = localStorage.getItem("splitbite_expenses");
  const oldMembers = localStorage.getItem("splitbite_members");
  const defaultGroup: Group = {
    id: crypto.randomUUID(),
    name: "My Group",
    members: oldMembers ? JSON.parse(oldMembers) : DEFAULT_MEMBERS,
    expenses: oldExpenses ? JSON.parse(oldExpenses) : [],
  };
  saveGroups([defaultGroup]);
  setActiveGroupId(defaultGroup.id);
  return [defaultGroup];
}

export function saveGroups(groups: Group[]): void {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
}

export function getActiveGroupId(): string | null {
  return localStorage.getItem(ACTIVE_GROUP_KEY);
}

export function setActiveGroupId(id: string): void {
  localStorage.setItem(ACTIVE_GROUP_KEY, id);
}

export function createGroup(name: string): Group {
  const group: Group = {
    id: crypto.randomUUID(),
    name,
    members: DEFAULT_MEMBERS,
    expenses: [],
  };
  const groups = loadGroups();
  groups.push(group);
  saveGroups(groups);
  return group;
}

export function updateGroup(updated: Group): void {
  const groups = loadGroups();
  const idx = groups.findIndex(g => g.id === updated.id);
  if (idx !== -1) {
    groups[idx] = updated;
    saveGroups(groups);
  }
}

export function deleteGroup(id: string): void {
  const groups = loadGroups().filter(g => g.id !== id);
  saveGroups(groups);
}
