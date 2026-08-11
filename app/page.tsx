export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-sans text-sm tracking-widest text-champagne uppercase">
        Sorteapp
      </p>
      <h1 className="font-display text-4xl text-foreground sm:text-5xl">
        Premio con respaldo
      </h1>
      <p className="max-w-md text-muted-foreground">
        La landing pública, el catálogo de tiers y el checkout se implementan
        en los próximos PRs. Este scaffold deja base de Next.js, Tailwind v4 y
        Supabase listos para construir sobre ella.
      </p>
    </main>
  );
}
