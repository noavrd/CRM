import { adminDb } from "../firebaseAdmin";

export async function getUserRoles(uid: string): Promise<string[]> {
  const doc = await adminDb.collection("roles").doc(uid).get();
  const roles = (doc.exists ? (doc.data()?.roles as string[] | undefined) : undefined) ?? [];
  return roles;
}

export async function hasRole(uid: string, role: string): Promise<boolean> {
  const roles = await getUserRoles(uid);
  return roles.includes(role);
}
