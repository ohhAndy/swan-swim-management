import { getCurrentUser } from "@/lib/auth/user";
import NewTermForm from "./NewTermForm"
import { hasPermission } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";

export default async function NewTermPage() {
    const user = await getCurrentUser();
    
    if(!user || !hasPermission(user.role, "manageTerms")) {
        redirect("/forbidden");
    }

    return(
        <main className="mx-auto max-w-3xl p-6">
            <h1 className="mb-4 text-2xl font-semibold">Create Term</h1>
            <NewTermForm />
        </main>        
    );
}