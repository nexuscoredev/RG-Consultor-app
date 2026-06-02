import { Redirect, type Href } from 'expo-router';

export default function ProposalRedirect() {
  return <Redirect href={'/(tabs)/commercial/proposal' as Href} />;
}
