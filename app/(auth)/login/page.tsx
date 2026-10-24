import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-brand-cream">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-full bg-brand-forest text-brand-cream font-bold flex items-center justify-center">
              CF
            </span>
            <span className="font-extrabold text-xl text-brand-forest tracking-tight">
              CaféFlow BD
            </span>
          </div>
          <CardTitle className="text-2xl">Staff & Owner Portal</CardTitle>
          <CardDescription>
            Authentication will be connected in Phase 1 via Supabase Auth.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground text-center">
            Foundation module ready for multi-tenant staff & owner login.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/" className="inline-flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Return to Landing Page
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
