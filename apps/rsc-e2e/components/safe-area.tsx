'use client';

// TODO: Some wonky errors with `react-native-safe-area-context` and React Native SafeAreaView.
// import { SafeAreaView as Upstream } from 'react-native-safe-area-context';
import { SafeAreaView as Upstream } from 'react-native';

export default function SafeAreaView(props) {
  return <Upstream {...props} />;
}
