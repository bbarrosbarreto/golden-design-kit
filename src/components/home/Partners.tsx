const PARTNERS = [
  "Parceiro 1",
  "Parceiro 2",
  "Parceiro 3",
  "Parceiro 4",
  "Parceiro 5",
];

export function Partners() {
  return (
    <section className="bg-surface py-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-xl text-foreground">
            Nossos Parceiros
          </h2>
          <p className="mt-2 font-body text-sm text-muted-foreground">
            Construtoras e parceiros selecionados
          </p>
        </div>

        <div className="mt-6 flex gap-6 overflow-x-auto pb-2 md:justify-center md:overflow-visible">
          {PARTNERS.map((name) => (
            <div
              key={name}
              className="flex h-20 w-40 shrink-0 items-center justify-center rounded-lg bg-muted grayscale transition-all duration-300 hover:grayscale-0"
            >
              <span className="font-body text-sm text-muted-foreground">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
