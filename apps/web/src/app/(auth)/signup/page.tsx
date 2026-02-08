"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SignUpForm from "@/components/sign-up-form";
import { authClient } from "@/lib/auth-client";
import Loader from "@/components/loader";

export default function SignUpPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      // Redirect based on role
      if (session.user.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/");
      }
    }
  }, [session, router]);

  // Show loading while checking session
  if (isPending) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Don't render signup form if user is authenticated
  if (session?.user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-start justify-center py-16">
      <SignUpForm onSwitchToSignIn={() => router.push("/login")} />
    </div>
  );
}