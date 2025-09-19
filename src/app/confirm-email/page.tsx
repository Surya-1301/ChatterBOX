"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { app } from "@/lib/realm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function ConfirmEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const tokenId = searchParams.get("tokenId");
    if (token && tokenId) {
      setLoading(true);
      app.emailPasswordAuth
        .confirmUser({ token, tokenId })
        .then(() => {
          setConfirmed(true);
          toast({ title: "Email Confirmed!", description: "You can now log in." });
        })
        .catch((err) => {
          setError(err?.error || err?.message || "Confirmation failed.");
        })
        .finally(() => setLoading(false));
    }
  }, [searchParams, toast]);

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Email Confirmation</h1>
      {loading && <p>Confirming your email...</p>}
      {confirmed && (
        <>
          <p className="mb-4">Your email has been confirmed!</p>
          <Button onClick={() => router.push("/login")}>Go to Login</Button>
        </>
      )}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
