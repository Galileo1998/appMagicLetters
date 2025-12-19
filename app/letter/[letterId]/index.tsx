// app/letter/[letterId]/index.tsx
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";

export default function LetterIndex() {
  const { letterId } = useLocalSearchParams<{ letterId: string }>();

  useEffect(() => {
    if (letterId) router.replace(`/letter/${String(letterId)}/options`);
  
  }, [letterId]);

  return null;
}
