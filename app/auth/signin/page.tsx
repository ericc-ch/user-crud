import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
