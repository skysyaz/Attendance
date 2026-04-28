import ProfileScreen from "../../src/components/ProfileScreen";
import { colors } from "../../src/theme";

export default function AdminProfile() {
  return (
    <ProfileScreen
      brandLabel="PROFILE"
      avatarBg={colors.textPrimary}
      rolePillLabel="ADMINISTRATOR"
      infoRows={[
        { label: "ACCOUNT TYPE", value: "Admin" },
        { label: "PERMISSIONS", value: "Full access" },
      ]}
      testId="admin-logout-button"
    />
  );
}
