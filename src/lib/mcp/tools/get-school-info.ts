import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "get_school_info",
  title: "Get school info",
  description:
    "Return public information about Kitesurf Passion: school name, location, contact details, and the disciplines taught.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const info = {
      name: "Kitesurf Passion",
      founded: 1999,
      location: "Carqueiranne / Hyères (Var), France",
      main_spot: "L'Almanarre, Hyères",
      website: "https://www.kitesurfpassion.fr",
      phone: "+33 6 72 71 69 05",
      email: "crosyo69@gmail.com",
      siret: "432 262 129 00039",
      disciplines: [
        "Cours de kitesurf",
        "Stage 100% Glisse",
        "Cours à la Carte (particulier)",
        "Cours Collectifs",
        "Stage wingfoil",
        "Cours pumpfoil / dock-start",
        "Foil tracté",
        "Wakeboard",
        "Déposes en mer",
        "Location de matériel",
      ],
      certifications: ["FFVL", "BPJEPS"],
    };
    return {
      content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
      structuredContent: info,
    };
  },
});