"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth";
import { GlassInput } from "@/components/ui/GlassInput";
import { GlassButton } from "@/components/ui/GlassButton";
import { AuthProvider } from "@/components/AuthProvider";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});
type FormValues = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await login(data.email, data.password);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid email or password");
    }
  };

  return (
    <main className="bg-mesh full-page-center">
      <div className="card animate-fade-in" style={{ width: "100%", maxWidth: "26rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "0.375rem" }}>Welcome back</h1>
          <p style={{ color: "#475569", fontSize: "0.875rem" }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1rem" }} noValidate>
          <GlassInput
            label="Email" type="email" placeholder="you@example.com"
            autoComplete="email" error={errors.email?.message}
            {...register("email")}
          />
          <GlassInput
            label="Password" type="password" placeholder="••••••••"
            autoComplete="current-password" error={errors.password?.message}
            {...register("password")}
          />
          <GlassButton type="submit" className="w-full" loading={isLoading}
            style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}>
            Sign In
          </GlassButton>
        </form>

        <p style={{ textAlign: "center", fontSize: "0.875rem", color: "#475569", marginTop: "1.5rem" }}>
          No account?{" "}
          <Link href="/register" style={{ color: "#818cf8", textDecoration: "none", fontWeight: 500 }}>
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <AuthProvider><LoginForm /></AuthProvider>;
}
