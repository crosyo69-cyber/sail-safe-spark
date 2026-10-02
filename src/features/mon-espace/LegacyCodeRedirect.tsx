import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { setPendingCode } from "./session-storage";

/**
 * LOT C-2.2-D : les codes clients ne doivent plus circuler dans l'URL.
 * On mémorise le code puis on redirige vers le parcours sécurisé.
 */
export const LegacyCodeRedirect = () => {
  const { code } = useParams<{ code: string }>();

  useEffect(() => {
    if (code) setPendingCode(code.toUpperCase());
  }, [code]);

  return <Navigate to="/mon-espace" replace />;
};

export default LegacyCodeRedirect;
