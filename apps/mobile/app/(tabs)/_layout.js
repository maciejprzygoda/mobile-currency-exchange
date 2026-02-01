import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
       
        tabBarStyle: { backgroundColor: 'rgba(21, 21, 21, 0.59)' },
        headerStyle: { backgroundColor: 'rgb(255, 255, 255)' },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Portfel' }} />
      <Tabs.Screen name="rates" options={{ title: 'Kursy' }} />
      <Tabs.Screen name="exchange" options={{ title: 'Wymiana' }} />
      <Tabs.Screen name="history" options={{ title: 'Historia' }} />
    </Tabs>
  );
}