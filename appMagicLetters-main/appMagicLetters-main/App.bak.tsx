import { useEffect } from "react";
import { getDb } from "./src/db"; // ajusta ruta

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      await getDb();
    })();
  }, []);

  return null; // tu layout real aquí
}
