import ResetPasswordForm from '@/components/auth/reset-password-form';

// Avoid strict typing here to remain compatible with Next's generated PageProps
export default function ResetPasswordPage({ searchParams }: any) {
  const token = Array.isArray(searchParams?.token) ? searchParams?.token[0] : searchParams?.token;
  const tokenId = Array.isArray(searchParams?.tokenId) ? searchParams?.tokenId[0] : searchParams?.tokenId;

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
      {!token || !tokenId ? (
        <div className="text-red-500 text-lg">
          Invalid or missing reset link.<br />
          Please use the password reset link sent to your email.
        </div>
      ) : (
        <ResetPasswordForm token={token} tokenId={tokenId} />
      )}
    </div>
  );
}
