
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Mail } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="p-4 md:p-8 flex flex-col items-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Have a question?</h1>
      </div>

      <Card className="w-full max-w-4xl my-8 bg-secondary/30">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-2 text-center">Terms and Conditions</h2>
          <p className="text-sm text-muted-foreground text-center">
            By clicking the buttons below, you agree to our{" "}
            <Link href="/privacy" className="underline hover:text-primary">
              Terms and Conditions
            </Link>{" "}
            and our{" "}
            <Link href="/privacy" className="underline hover:text-primary">
              Privacy Policy
            </Link>
            , and also agree and acknowledge that your chats and/or calls with
            us and data collected in them may be viewed, used and saved by us
            and our third party vendors or agents to improve your experience and
            for customer service purposes. Please visit our{" "}
            <Link href="/privacy" className="underline hover:text-primary">
              Privacy Policy
            </Link>{" "}
            for further information.
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-2xl">
        <div className="flex flex-col items-center text-center gap-4">
            <div className="p-4 bg-accent/20 rounded-full">
                <MessageSquare className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Ask any question</h3>
            <Button asChild>
                <Link href="https://t.me/Jethu0102" target="_blank" rel="noopener noreferrer">Chat now</Link>
            </Button>
        </div>
        <div className="flex flex-col items-center text-center gap-4">
            <div className="p-4 bg-accent/20 rounded-full">
                <Mail className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Mail our team</h3>
            <Button asChild>
                <a href="mailto:vmazedaar@gmail.com">Mail now</a>
            </Button>
        </div>
      </div>
    </div>
  );
}
