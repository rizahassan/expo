import { type ReactNode } from 'react';

import { Link } from 'expo-router/build/rsc/router/client';
import { Children } from 'expo-router/build/rsc/client';
import { ActivityIndicator, Text, View } from 'react-native';
import SafeAreaView from '@/components/safe-area';
import { Footer } from '@/components/footer';

import { enableScreens, NativeScreen } from 'react-native-screens';

const HomeLayout = ({
  children,
  ...props
}: {
  children: ReactNode;
  path: string;
  searchParams: URLSearchParams;
}) => {
  return (
    <SafeAreaView
      edges={{
        bottom: 'off',
        top: 'additive',
      }}
      testID="safe-area-root"
      style={{ backgroundColor: '#191A20', flex: 1, gap: 8 }}>
      {/* <title>Concurrent Router</title> */}
      <View style={{ flex: 1, padding: 12 }} testID="layout-child-wrapper">
        <Children />
      </View>
      {/* <View style={{ flex: 1, padding: 12 }} testID="layout-child-wrapper">
        {children}
      </View> */}
      <Footer
        path={props.path}
        items={[
          { icon: 'home', href: '/' },
          { icon: 'apple-keyboard-option', href: '/bar' },
          { icon: 'share-outline', href: '/fashion' },
        ]}
      />
    </SafeAreaView>
  );
};

export default HomeLayout;

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <body>{children}</body>
//     </html>
//   );
// }
