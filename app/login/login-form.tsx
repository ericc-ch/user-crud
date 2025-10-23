"use client";

import { useActionState } from "react";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, formAction, isPending] = useActionState(
    async (
      _prevState: { error: string } | null,
      formData: FormData
    ): Promise<{ error: string } | null> => {
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      const { error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        return { error: error.message || "Login failed" };
      }

      redirect("/app");
    },
    null
  );

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="p-0">
          <form action={formAction} className="p-6">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your account
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  disabled={isPending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  disabled={isPending}
                />
              </Field>
              {state?.error && (
                <div className="text-sm text-red-600">{state.error}</div>
              )}
              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Logging in..." : "Login"}
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Don&apos;t have an account?{" "}
                <a href="/signup" className="underline">
                  Sign up
                </a>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
