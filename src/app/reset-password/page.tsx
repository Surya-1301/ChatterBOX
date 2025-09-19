"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { app } from "@/lib/realm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const token = searchParams.get("token");
  const tokenId = searchParams.get("tokenId");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!token || !tokenId) {
      setError("Invalid or missing token.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await app.emailPasswordAuth.resetPassword({ token, tokenId, password });
      setSuccess(true);
      toast({ title: "Password Reset!", description: "You can now log in with your new password." });
    } catch (err: any) {
      setError(err?.error || err?.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
      {!token || !tokenId ? (
        <div className="text-red-500 text-lg">
          Invalid or missing reset link.<br />
          Please use the password reset link sent to your email.
        </div>
      ) : success ? (
        <>
          <p className="mb-4">Your password has been reset!</p>
          <Button onClick={() => router.push("/login")}>Go to Login</Button>
        </>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          <Input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      )}
    </div>
  );
}
