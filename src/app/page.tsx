import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Navbar */}
      <header className="border-b border-zinc-800/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg">✦</span>
            <span className="font-semibold tracking-tight">Benglish</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-zinc-500 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>

            <a href="#how-it-works" className="transition hover:text-white">
              How it works
            </a>

            <a href="#why-benglish" className="transition hover:text-white">
              Why Benglish
            </a>
          </nav>

          <Link
            href="/api/auth/signin"
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_45%)]" />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-24 sm:pt-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-4 py-2 text-sm text-zinc-400">
              <span className="text-white">✦</span>A personal writing workspace
            </div>

            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
              Your thoughts.
              <br />
              <span className="text-zinc-500">
                Your language. Your workspace.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
              Benglish is a distraction-free writing workspace designed for
              people who think in both Bengali and English. Write stories,
              poems, drafts and ideas naturally.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/api/auth/signin"
                className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
              >
                Start Writing
              </Link>

              <a
                href="#features"
                className="rounded-lg border border-zinc-800 px-6 py-3 text-sm font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-white"
              >
                Explore Features
              </a>
            </div>
          </div>

          {/* Product Preview */}
          <div className="mx-auto mt-20 max-w-5xl">
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/40">
              {/* Window bar */}
              <div className="flex h-10 items-center gap-2 border-b border-zinc-800 px-4">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />

                <div className="ml-4 text-xs text-zinc-600">
                  Benglish Workspace
                </div>
              </div>

              {/* Fake application */}
              <div className="grid min-h-[420px] grid-cols-[210px_1fr]">
                {/* Sidebar */}
                <div className="border-r border-zinc-800 bg-zinc-950 p-4">
                  <div className="mb-6 text-sm font-semibold">✦ Benglish</div>

                  <p className="mb-3 text-[10px] font-semibold tracking-widest text-zinc-600">
                    EXPLORER
                  </p>

                  <div className="space-y-1 text-xs">
                    <div className="rounded bg-zinc-800 px-3 py-2 text-zinc-200">
                      📂 Stories
                    </div>

                    <div className="px-3 py-2 text-zinc-500">
                      📄 My First Story
                    </div>

                    <div className="px-3 py-2 text-zinc-500">📄 Kolkata</div>

                    <div className="rounded px-3 py-2 text-zinc-500">
                      📁 Poems
                    </div>

                    <div className="rounded px-3 py-2 text-zinc-500">
                      📁 Drafts
                    </div>

                    <div className="rounded px-3 py-2 text-zinc-500">
                      📁 Others
                    </div>
                  </div>
                </div>

                {/* Editor */}
                <div className="bg-zinc-950 p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-600">Stories</p>

                      <h3 className="mt-2 text-2xl font-semibold">
                        My First Story
                      </h3>
                    </div>

                    <span className="rounded-full bg-zinc-900 px-3 py-1.5 text-[11px] text-zinc-600">
                      Saved
                    </span>
                  </div>

                  <div className="mt-10 max-w-2xl space-y-5 text-sm leading-8 text-zinc-500">
                    <p>ekta shomoy chhilo jokhon ami bhabtam...</p>

                    <p>কিন্তু এখন আমি অন্যভাবে ভাবতে শিখেছি।</p>

                    <p>Write the way you think.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-zinc-900 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-zinc-500">FEATURES</p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to write.
            </h2>

            <p className="mt-4 leading-7 text-zinc-500">
              A focused writing environment without the complexity of a full
              productivity suite.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon="ক"
              title="Bengali Transliteration"
              description="Type Bengali phonetically using English and turn your thoughts into Bengali naturally."
            />

            <Feature
              icon="Aa"
              title="English When You Need It"
              description="Keep English text as English whenever transliteration isn't what you want."
            />

            <Feature
              icon="↻"
              title="Automatic Saving"
              description="Your writing is continuously saved to your workspace while you work."
            />

            <Feature
              icon="▣"
              title="Organized Workspace"
              description="Keep stories, poems, drafts and other writing organized into folders."
            />

            <Feature
              icon="▤"
              title="Collections"
              description="Group related works together without moving them between folders."
            />

            <Feature
              icon="↓"
              title="Export Your Work"
              description="Take your writing with you through TXT, DOCX and PDF exports."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-t border-zinc-900 bg-zinc-900/20 px-6 py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-500">HOW IT WORKS</p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              From thought to finished work.
            </h2>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            <Step
              number="01"
              title="Create a workspace"
              description="Sign in and get your personal writing workspace with folders ready for your ideas."
            />

            <Step
              number="02"
              title="Start writing"
              description="Create a work and write naturally. Switch between Bengali and English whenever you want."
            />

            <Step
              number="03"
              title="Keep creating"
              description="Your work stays organized and automatically saved so you can come back whenever inspiration strikes."
            />
          </div>
        </div>
      </section>

      {/* Why Benglish */}
      <section
        id="why-benglish"
        className="border-t border-zinc-900 px-6 py-24"
      >
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-medium text-zinc-500">WHY BENGLISH</p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Don't change the way you think just to write.
            </h2>

            <p className="mt-6 leading-8 text-zinc-500">
              Sometimes the idea comes in Bengali. Sometimes it comes in
              English. Sometimes it comes as a mixture of both.
            </p>

            <p className="mt-4 leading-8 text-zinc-500">
              Benglish is built around that reality. Instead of forcing you into
              one language or one workflow, it gives you a workspace where your
              writing can evolve naturally.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
            <div className="space-y-6">
              <div>
                <p className="text-xs text-zinc-600">PHONETIC INPUT</p>

                <p className="mt-2 text-lg text-zinc-400">kemon achho ajke?</p>
              </div>

              <div className="text-center text-zinc-700">↓</div>

              <div>
                <p className="text-xs text-zinc-600">BENGALI WRITING</p>

                <p className="mt-2 text-xl text-zinc-200">কেমন আছো আজকে?</p>
              </div>

              <div className="border-t border-zinc-800 pt-5 text-sm text-zinc-600">
                And when you want English, just keep writing in English.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-900 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Your next story starts here.
          </h2>

          <p className="mx-auto mt-5 max-w-xl leading-7 text-zinc-500">
            Create your personal writing workspace and start putting your ideas
            somewhere they can grow.
          </p>

          <Link
            href="/api/auth/signin"
            className="mt-8 inline-flex rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
          >
            Start Writing for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span>✦</span>
            <span>Benglish</span>
          </div>

          <p>A personal writing workspace.</p>
        </div>
      </footer>
    </main>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 transition hover:border-zinc-700">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-sm text-zinc-300">
        {icon}
      </div>

      <h3 className="mt-5 font-semibold text-zinc-200">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative">
      <span className="text-sm font-semibold text-zinc-700">{number}</span>

      <h3 className="mt-4 text-lg font-semibold text-zinc-200">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
    </div>
  );
}
