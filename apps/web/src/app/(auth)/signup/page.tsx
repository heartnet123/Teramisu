"use client";
import { useRouter } from "next/navigation";
import SignUpForm from "@/components/sign-up-form";

export default function SignUpPage() {
  const router = useRouter();

  return (
    <div className="min-h-[70vh] flex items-start justify-center py-16">
      <SignUpForm onSwitchToSignIn={() => router.push("/login")} />
    </div>
  );
}