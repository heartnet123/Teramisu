"use client";

import React, { useState } from "react";
import SignInForm from "@/components/sign-in-form";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-stone-900 rounded-xl mx-auto mb-6 flex items-center justify-center text-white font-bold text-2xl shadow-lg">J</div>
          <h2 className="text-3xl font-serif text-stone-900">{isLogin ? 'Welcome Back' : 'Join the Ritual'}</h2>
          <p className="text-stone-500 mt-3">Enter your details to access your subscription.</p>
        </div>

        <Card className="p-8 shadow-xl border-none ring-1 ring-stone-900/5 bg-white/80 backdrop-blur-sm">
          <SignInForm onSwitchToSignUp={() => router.push('/signup')} />
        </Card>

        <div className="mt-8 text-center text-sm text-black">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              router.push(isLogin ? '/signup' : '/login');
            }}
            className="text-stone-900 font-semibold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>
    </div>
  );
}