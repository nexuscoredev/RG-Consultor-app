import { Redirect, type Href } from 'expo-router';

export default function PipelineRedirect() {
  return <Redirect href={'/(tabs)/commercial/pipeline' as Href} />;
}
