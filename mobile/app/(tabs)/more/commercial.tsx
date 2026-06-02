import { Redirect, type Href } from 'expo-router';

export default function CommercialRedirect() {
  return <Redirect href={'/(tabs)/commercial' as Href} />;
}
