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
import { LocationSwitcher } from "@/components/LocationSwitcher";

export async function AppHeader() {
  const user = await getCurrentUser();
  if (!user) return;

  return (
    <header className="sticky top-0 z-40 backdrop-blur dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/NoBGLogoSQ.svg"
            alt="Swan Swim School"
            width={32}
            height={32}
            priority
          />
          <span className="text-sm font-semibold hidden sm:block whitespace-nowrap">
            Swan Swim School Admin
          </span>
        </Link>
        {/* spacer */}
        <nav className="ml-auto flex items-center gap-3">
          <PermissionGate
            allowedRoles={["super_admin", "admin", "manager"]}
            currentRole={user.role}
          >
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center text-sm font-medium hover:text-blue-600 outline-none">
                Profiles <ChevronDown className="ml-1 h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/students">Students</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/guardians">Guardians</Link>
                </DropdownMenuItem>
                <PermissionGate
                  allowedRoles={["super_admin", "admin", "manager"]}
                  currentRole={user.role}
                >
                  <DropdownMenuItem asChild>
                    <Link href="/admin/instructors">Instructors</Link>
                  </DropdownMenuItem>
                </PermissionGate>
              </DropdownMenuContent>
            </DropdownMenu>
          </PermissionGate>
          <PermissionGate
            allowedRoles={["super_admin", "admin", "manager"]}
            currentRole={user.role}
          >
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center text-sm font-medium hover:text-blue-600 outline-none">
                Billing <ChevronDown className="ml-1 h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <PermissionGate
                  allowedRoles={["super_admin", "admin"]}
                  currentRole={user.role}
                >
                  <DropdownMenuItem asChild>
                    <Link href="/invoices">Invoices</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/payments">Payments</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/inventory">Inventory</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/pos">Point of Sale</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/financials">Financial Insights</Link>
                  </DropdownMenuItem>
                </PermissionGate>
                <DropdownMenuItem asChild>
                  <Link href="/enrollments/uninvoiced">Uninvoiced</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </PermissionGate>
          <PermissionGate
            allowedRoles={["super_admin", "admin", "manager"]}
            currentRole={user.role}
          >
            <Link
              href="/term"
              className="text-sm font-medium hover:text-blue-600"
            >
              Schedule
            </Link>
          </PermissionGate>
          <PermissionGate
            allowedRoles={["super_admin", "admin", "manager", "supervisor"]}
            currentRole={user.role}
          >
            <Link
              href="/tasks"
              className="text-sm font-medium hover:text-blue-600"
            >
              Tasks
            </Link>
          </PermissionGate>
          <LocationSwitcher />
          <UserMenu user={user} />
        </nav>
      </div>
    </header>
  );
}
