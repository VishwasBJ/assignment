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
  username: z.string().min(3, "At least 3 characters").max(30),
  password: z.string().min(8, "At least 8 characters"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match" });
type FormValues = z.infer<typeof schema>;

function RegisterForm() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      await registerUser(data.email, data.username, data.password);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <main className="bg-mesh full-page-center">
      <div className="card animate-fade-in" style={{ width: "100%", maxWidth: "26rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "0.375rem" }}>Create your account</h1>
          <p style={{ color: "#475569", fontSize: "0.875rem" }}>Start reviewing code with AI</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1rem" }} noValidate>
          <GlassInput label="Email" type="email" placeholder="you@example.com" autoComplete="email" error={errors.email?.message} {...register("email")} />
          <GlassInput label="Username" type="text" placeholder="johndoe" autoComplete="username" error={errors.username?.message} {...register("username")} />
          <GlassInput label="Password" type="password" placeholder="Min 8 characters" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
          <GlassInput label="Confirm Password" type="password" placeholder="Repeat password" autoComplete="new-password" error={errors.confirm?.message} {...register("confirm")} />
          <GlassButton type="submit" loading={isLoading} style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}>
            Create Account
          </GlassButton>
        </form>

        <p style={{ textAlign: "center", fontSize: "0.875rem", color: "#475569", marginTop: "1.5rem" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#818cf8", textDecoration: "none", fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return <AuthProvider><RegisterForm /></AuthProvider>;
}
