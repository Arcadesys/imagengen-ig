'use client';

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthErrorContent() {
  const sp = useSearchParams();
  const rawError = sp.get("error") ?? undefined;
  const error = Array.isArray(rawError) ? rawError[0] : rawError;

  const messages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "Access denied.",
    Verification: "The verification link is invalid or has expired.",
    OAuthAccountNotLinked:
      "To confirm your identity, sign in with the same account you used originally.",
    EmailSignin: "There was a problem sending the sign-in email.",
    CredentialsSignin: "Sign in failed. Check the details you provided.",
    Default: "Something went wrong during sign-in. Please try again.",
  };

  const message = (error && messages[error]) || messages.Default;

  return (
    <div className="max-w-md text-center">
      <h1 className="text-2xl font-semibold mb-2">Sign-in error</h1>
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-center">
        <Link
          href="/auth/signin"
          className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800"
        >
          Try again
        </Link>
        <Link
          href="/"
          className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="max-w-md text-center">
      <h1 className="text-2xl font-semibold mb-2">Sign-in error</h1>
      <p className="text-gray-600 mb-6">Loading...</p>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center p-6">
      <Suspense fallback={<LoadingFallback />}>
        <AuthErrorContent />
      </Suspense>
    </main>
  );
}
