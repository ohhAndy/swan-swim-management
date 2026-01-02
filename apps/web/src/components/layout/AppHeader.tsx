import Image from "next/image";
import Link from "next/link";
import { UserMenu } from "../auth/UserMenu";
import { getCurrentUser } from "@/lib/auth/user";
import { PermissionGate } from "../auth/PermissionGate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export async function AppHeader() {
  const user = await getCurrentUser();
  if (!user) return;

  return (
    <header className="sticky top-0 z-40 backdrop-blur dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-3">
        <Image
          src="/NoBGLogoSQ.svg"
          alt="Swan Swim School"
          width={40}
          height={40}
          priority
        />

        <span className="text-base font-semibold hidden sm:block">
          Swan Swim School Admin
        </span>

        {/* spacer */}
        <nav className="ml-auto flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium hover:text-blue-600"
          >
            Dashboard
          </Link>
          <PermissionGate
            allowedRoles={["admin", "manager"]}
            currentRole={user.role}
          >
            <Link
              href="/students"
              className="text-sm font-medium hover:text-blue-600"
            >
              Students
            </Link>
          </PermissionGate>
          <PermissionGate
            allowedRoles={["admin", "manager"]}
            currentRole={user.role}
          >
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center text-sm font-medium hover:text-blue-600 outline-none">
                Billing <ChevronDown className="ml-1 h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/invoices">Invoices</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/payments">Payments</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/enrollments/uninvoiced">Uninvoiced</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </PermissionGate>
          <PermissionGate
            allowedRoles={["admin", "manager"]}
            currentRole={user.role}
          >
            <Link
              href="/term"
              className="text-sm font-medium hover:text-blue-600"
            >
              Schedule
            </Link>
          </PermissionGate>
          <UserMenu user={user} />
        </nav>
      </div>
    </header>
  );
}
