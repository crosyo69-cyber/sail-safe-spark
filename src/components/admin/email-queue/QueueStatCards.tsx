import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Inbox } from "lucide-react";
import type { QueueStats } from "@/features/admin-email-queue/types";

export const QueueStatCards = ({ stats }: { stats: QueueStats }) => (
  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">Total</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="text-2xl font-bold flex items-center gap-1">
          <Inbox className="w-4 h-4 text-primary" />{stats.total}
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">En attente</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="text-2xl font-bold text-blue-500">{stats.pending}</div>
      </CardContent>
    </Card>
    <Card className={stats.stuck > 0 ? "border-destructive" : ""}>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">Bloqués &gt;15min</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className={`text-2xl font-bold ${stats.stuck > 0 ? "text-destructive" : ""}`}>{stats.stuck}</div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">Envoyés</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">DLQ</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="text-2xl font-bold text-destructive">{stats.dlq}</div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">Supprimés</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="text-2xl font-bold text-yellow-500">{stats.suppressed}</div>
      </CardContent>
    </Card>
  </div>
);
