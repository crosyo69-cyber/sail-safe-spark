import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";

export const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "sent":
      return (
        <Badge className="bg-green-600 hover:bg-green-700 text-white">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Envoyé
        </Badge>
      );
    case "dlq":
    case "failed":
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          DLQ
        </Badge>
      );
    case "suppressed":
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Supprimé
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
          <Clock className="w-3 h-3 mr-1" />
          En attente
        </Badge>
      );
    case "bounced":
      return <Badge variant="destructive">Bounce</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};