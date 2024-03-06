import { ScrollView } from 'react-native';

import SafeAreaView from '../../components/safe-area';
import A10_ServerActions from '../10-server-actions/entry';

const App = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          gap: 8,
          padding: 8,
          justifyContent: 'center',
          alignItems: 'stretch',
        }}>
        <A10_ServerActions />
      </ScrollView>
    </SafeAreaView>
  );
};

export default App;
