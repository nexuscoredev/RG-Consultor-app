import { Redirect, type Href } from 'expo-router';

export default function ContractFlowRedirect() {
  return <Redirect href={'/(tabs)/commercial/contract-flow' as Href} />;
}
