// Server component: confirm-email route has been disabled.
// Previously this page used client-only hooks which caused production builds to fail.
export default function ConfirmEmailPage() {
  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Email Confirmation Disabled</h1>
      <p className="mb-4">Email confirmation via link has been disabled for this deployment.</p>
      <p className="text-sm text-muted-foreground">If you signed up, try logging in directly or request a password reset.</p>
    </div>
  );
}
