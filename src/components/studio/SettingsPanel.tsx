type SettingsPanelProps = {
  userId: string;
};

export function SettingsPanel({ userId }: SettingsPanelProps) {
  return (
    <div className="studio-panel stack">
      <section className="studio-card stack">
        <h2 className="studio-section-title">Account</h2>
        <dl className="studio-dl">
          <div>
            <dt>User ID</dt>
            <dd>{userId}</dd>
          </div>
        </dl>
        <p className="muted">
          User IDs are case-insensitive at sign-in. Password must be at least 6
          characters. Use the sign-out icon in the top header to end your
          session.
        </p>
      </section>
    </div>
  );
}
