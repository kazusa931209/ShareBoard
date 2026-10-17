import { SettingsPanel } from "@/components/studio/SettingsPanel";
import { getSessionUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await getSessionUser();

  return <SettingsPanel userId={user?.userId ?? ""} />;
}
