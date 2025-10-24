import { Button } from "@/components/ui/button";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <img
          src="/cat-thumbs-up.jpg"
          alt="Cat thumbs up"
          className="mx-auto mb-8 w-64 h-64 object-contain rounded-lg"
        />
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          User Management System
        </h1>
        <p className="text-muted-foreground text-lg mb-6">
          You should go to one of these:
        </p>
        <div className="flex flex-col gap-3 mb-8">
          {session ? (
            <>
              <Link href="/app">
                <Button size="lg" className="w-full">
                  Dashboard
                </Button>
              </Link>
              <Link href="/app/users">
                <Button size="lg" variant="outline" className="w-full">
                  Users
                </Button>
              </Link>
              <Link href="/app/roles">
                <Button size="lg" variant="outline" className="w-full">
                  Roles
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button size="lg" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="lg" variant="outline" className="w-full">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
