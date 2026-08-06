import { TRUST_BADGES } from "../constants";

/** Key figures displayed under the expertise section. */
export function TrustBadges() {
  return (
    /* Trust badges */
    <div className="bg-card rounded-3xl p-8 md:p-12 border border-border/50">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {TRUST_BADGES.map((badge) => (
          <div key={badge.label}>
            <p className="font-display text-4xl font-bold text-primary mb-2">{badge.value}</p>
            <p className="text-muted-foreground text-sm">{badge.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
