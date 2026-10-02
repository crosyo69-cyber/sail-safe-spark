/** TEMPLATE — Composant de présentation pur : props in, JSX out. < 300 lignes. */
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ExampleRow } from "../types";

interface ExampleTableProps {
  rows: ExampleRow[];
  onNotify: (row: ExampleRow) => void;
}

export const ExampleTable = ({ rows, onNotify }: ExampleTableProps) => (
  <Card>
    <CardContent className="p-0 divide-y">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center justify-between gap-3 p-4">
          <span className="text-sm text-foreground">{row.label}</span>
          <Button size="sm" variant="outline" onClick={() => onNotify(row)}>
            Notifier
          </Button>
        </div>
      ))}
      {rows.length === 0 && (
        <p className="p-6 text-sm text-muted-foreground">Aucun élément.</p>
      )}
    </CardContent>
  </Card>
);