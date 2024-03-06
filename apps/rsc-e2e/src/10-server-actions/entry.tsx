import { Text, View } from 'react-native';

import { UIHost } from './ui-host';
import { Counter } from './counter';
import { renderNativeViews } from './renderFunc';
import { greet, getCounter, increment } from './funcs';

type ServerFunction<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => Promise<R>
  : never;

export default function ServerActionTest() {
  console.log('Server Actions:', { increment, greet, getCounter, renderNativeViews });
  return (
    <View
      style={{
        borderWidth: 3,
        borderColor: 'green',
        borderStyle: 'dashed',
        padding: 8,
        gap: 8,
      }}>
      <Text style={{ fontWeight: 'bold' }}>10) Server Action (Server Component)</Text>

      <Text>Server counter: {getCounter()}</Text>
      <Counter
        greet={greet as unknown as ServerFunction<typeof greet>}
        increment={increment as unknown as ServerFunction<typeof increment>}
      />
      <Text>Date rendered: {new Date().toISOString()}</Text>

      <UIHost
        renderNativeViews={renderNativeViews as unknown as ServerFunction<typeof renderNativeViews>}
      />
    </View>
  );
}
