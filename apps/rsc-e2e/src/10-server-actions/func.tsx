'use server';

import OS from 'expo-router/os';

import { View, Switch, TextInput, ScrollView, Text } from 'react-native';

// async function* asyncGenerator() {
//   yield <Text>One</Text>;
//   await new Promise((resolve) => setTimeout(resolve, 1000));
//   yield <Text>Two</Text>;
//   await new Promise((resolve) => setTimeout(resolve, 1000));
//   return <Text>Three</Text>;
// }

export const greet = (name: string) => {
  // return asyncGenerator();
  return (
    <View style={{ borderWidth: 1, padding: 4, margin: 4, gap: 8 }}>
      <View>
        <Text style={{}}>Server Action</Text>
        <Text>[Env] Platform = {OS}</Text>
        <Text>[Param] name = {name}</Text>
      </View>
      <Text style={{ color: 'darkcyan' }}>
        Hello {name} from {OS} Expo Router server!
      </Text>
      <Text>More native! views from the server</Text>
      {/* <TextInput
        style={{
          height: 40,
          margin: 12,
          borderWidth: 1,
          padding: 10,
        }}
        placeholder="useless placeholder"
      /> */}
      {/* <Switch trackColor={{ false: '#767577', true: '#81b0ff' }} ios_backgroundColor="#3e3e3e" /> */}
    </View>
  );
};
