"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  CalendarPlus,
  CircleAlert,
  CircleHelp,
  Info,
  LogIn,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/DateTimePicker";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { groupingStrategyTooltips } from "@/app/utils/common";
import { AdminCard } from "@/components/AdminCard";

export default function Page() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [admins, setAdmins] = useState<{ email: string }[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const handleAddAdmin = async () => {
    setAddError("");

    const email = newAdminEmail.trim().toLowerCase();
    if (!email) {
      setAddError("Email is required.");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/admin/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }), // always adds as EVENTADMIN
      });

      const data = await res.json();
      if (!res.ok) {
        setAddError(data.message || "Failed to add admin.");
      } else {
        toast.success("Event admin added");
        setAdmins((prev) => [...prev, { email }]);
        setNewAdminEmail("");
      }
    } catch (err) {
      console.error(err);
      setAddError("An error occurred while adding admin.");
    } finally {
      setAdding(false);
    }
  };

  useEffect(() => {
    fetch("/api/admin/access")
      .then((res) => res.json())
      .then((data) => {
        setAdmins(data.admins);
        setCurrentUserRole(data.currentUserRole); // 👈 store role
      })
      .catch(() => toast.error("Failed to fetch admin list"));
  }, []);

  const handleDelete = async (email: string) => {
    const confirmed = confirm(`Remove access for ${email}?`);
    if (!confirmed) return;

    try {
      const res = await fetch(
        `/api/admin/access/${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        setAdmins((prev) => prev.filter((admin) => admin.email !== email));
        toast.success("Admin removed");
      } else {
        toast.error("Failed to remove admin");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    }
  };
  return (
    <div className="flex w-full justify-center p-6 md:p-10 h-full">
      <div className="flex flex-col gap-4 w-full max-w-xl">
        <Card className="w-full p-6">
          <div className="flex flex-col items-center text-center">
            <Image
              src="/paypal_logo.png"
              width={120}
              height={60}
              alt="paypal icon"
            />
            <p className="mb-2 text-2xl font-bold">Admin Portal Access</p>
          </div>
          {currentUserRole === "SUPERADMIN" && (
            <div className="flex flex-col mt-4">
              <Label htmlFor="new-admin-email">Add new admin</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                This admin will be able to organise events, unable to remove
                other admins.
              </p>
              <div className="flex gap-2 mt-1">
                <Input
                  id="new-admin-email"
                  type="email"
                  placeholder="Enter admin email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddAdmin} disabled={adding}>
                  {adding ? <LoadingSpinner /> : "Add"}
                </Button>
              </div>
              {addError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <CircleAlert size={16} /> {addError}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-col gap-3">
            {admins.map((admin) => (
              <AdminCard
                key={admin.email}
                email={admin.email}
                onDelete={
                  currentUserRole === "SUPERADMIN"
                    ? () => handleDelete(admin.email)
                    : undefined
                }
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
