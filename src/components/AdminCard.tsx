"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function AdminCard({
  email,
  onDelete,
}: {
  email: string;
  onDelete?: () => void;
}) {
  return (
    <Card className="flex items-center justify-between px-4 py-2 transition-colors flex-row">
      <div className="text-sm font-medium text-gray-800">{email}</div>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 size={16} />
        </Button>
      )}
    </Card>
  );
}
