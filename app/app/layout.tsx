import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AppSidebar } from "./app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { QueryProvider } from "@/lib/query-client";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <QueryProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </QueryProvider>
    </NuqsAdapter>
  );
}
