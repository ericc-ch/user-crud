"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/auth/signin");
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <img 
              src="/confused-cat.gif" 
              alt="Confused cat" 
              className="mx-auto mb-8 w-96 h-96 object-contain"
            />
            <h1 className="text-3xl font-bold tracking-tight">Welcome to Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Select a page from the sidebar to get started
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
