
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background min-h-screen">
        <header className="p-4 border-b bg-secondary/50 backdrop-blur-sm sticky top-0">
            <div className="container mx-auto flex items-center gap-4">
                <Button asChild variant="ghost" size="icon">
                    <Link href="/chat">
                        <ArrowLeft />
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold">Contact Us</h1>
            </div>
        </header>
        <main className="container mx-auto py-8">
            {children}
        </main>
    </div>
  );
}
