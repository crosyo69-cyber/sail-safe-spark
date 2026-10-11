export function FfvlLicenceNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return <p className="text-foreground text-sm leading-relaxed mt-1">Licence FFVL non incluse</p>;
  }

  return (
    <span className="block text-foreground text-sm leading-relaxed">
      La licence n'est pas incluse dans le tarif. Elle est à prendre en ligne sur{" "}
      <a href="https://ffvl.fr" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        ffvl.fr
      </a>{" "}
      avant la session.
    </span>
  );
}