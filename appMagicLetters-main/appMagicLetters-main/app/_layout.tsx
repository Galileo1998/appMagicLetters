// app/_layout.tsx
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { initDb } from "../src/db";
import { getMe, getSession } from "../src/repos/auth_repo";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments(); // para saber dónde estás
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await initDb();

      const session = await getSession();
      const inAuth = segments[0] === "login"; // ruta login

      // 1) Si no hay sesión -> login
      if (!session) {
        if (!inAuth) router.replace("/login");
        setReady(true);
        return;
      }

      // 2) Hay sesión -> leer usuario
      const me = await getMe();
      if (!me) {
        router.replace("/login");
        setReady(true);
        return;
      }

      // 3) Redirecciones según rol
      if (me.role === "ADMIN") {
        if (segments[0] !== "admin") router.replace("/admin");
      } else {
        // TECH
        if (segments[0] === "admin" || segments[0] === "login") router.replace("/");
      }

      setReady(true);
    })();
  }, [segments.join("/")]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
