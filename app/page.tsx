import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Heart, Users, MessageCircle, Trophy } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/30 via-background to-background" />
        <div className="relative mx-auto max-w-5xl px-6 py-24 sm:py-32">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <Heart className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">For Couples</span>
            </div>
            <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              How Well Do You Really Know Each Other?
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg text-muted-foreground">
              Create custom questions, challenge your partner, and discover just how connected you truly are. A fun, intimate game designed for couples.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="text-base">
                <Link href="/auth/sign-up">Start Playing</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base bg-transparent">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border bg-card py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold text-foreground">How It Works</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Simple, fun, and designed to bring you closer together
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <MessageCircle className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-foreground">Create Questions</h3>
              <p className="mt-2 text-muted-foreground">
                Write personal questions about yourself that your partner will answer
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-foreground">Invite Your Partner</h3>
              <p className="mt-2 text-muted-foreground">
                Share the game room with your significant other to start playing
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Trophy className="h-7 w-7 text-primary" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-foreground">See the Results</h3>
              <p className="mt-2 text-muted-foreground">
                Compare answers and discover how well you really know each other
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <Heart className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 text-3xl font-bold text-foreground">Ready to Play?</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join thousands of couples who have discovered new things about each other through our game.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/auth/sign-up">Get Started Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-5xl px-6 text-center text-sm text-muted-foreground">
          Made with love for couples everywhere
        </div>
      </footer>
    </main>
  );
}
