import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GroupCard, type GroupCardProps } from "./GroupCard";
import type { DailyGroup } from "@/features/admin-journees/types";

export interface ActivityColumnProps extends Omit<GroupCardProps, "group"> {
  title: string;
  icon: JSX.Element;
  groups: DailyGroup[];
}

export const ActivityColumn = ({ title, icon, groups, ...actions }: ActivityColumnProps) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-xl font-display font-bold">{title}</h2>
      <Badge variant="secondary">{groups.length} groupe{groups.length > 1 ? "s" : ""}</Badge>
    </div>
    {groups.length === 0 && (
      <Card className="p-4 text-sm text-muted-foreground">Aucun groupe.</Card>
    )}
    {groups.map((g) => (
      <GroupCard key={g.id} group={g} {...actions} />
    ))}
  </div>
);
