import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "./components/Sidebar";
import { getWorkspaceFolders } from "@/lib/workspace";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const folders = await getWorkspaceFolders(session.user.id);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-white">
      <Sidebar
        folders={folders}
        userId={session.user.id}
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
      />

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}