import { Redirect, useLocalSearchParams } from 'expo-router';
export default function QuestionsScreen() {
  const { letterId } = useLocalSearchParams<{ letterId: string }>();
  return <Redirect href={`/letter/${letterId}/message`} />;
}
