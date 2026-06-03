import React from 'react';
import 'react-native-gesture-handler';
import './i18n/i18next';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {StatusBar} from 'react-native';

import {Material3ThemeProvider} from './theme/ThemeContext';
import {AuthProvider, useAuth} from './auth/AuthProvider';
import {useEburonBootstrap} from './bootstrap/useEburonBootstrap';

import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';
import BootstrapScreen from './components/BootstrapScreen';
import ChatScreen from './components/ChatScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const {user, initializing} = useAuth();
  const {status, progress, message, error} = useEburonBootstrap(user ?? null);

  if (initializing) {
    return <SplashScreen />;
  }

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  if (status !== 'ready' && status !== 'error') {
    return (
      <BootstrapScreen
        status={status}
        progress={progress}
        message={message}
        error={error}
        onRetry={() => {
          // Retry by forcing a re-render — user can navigate back and re-enter
        }}
      />
    );
  }

  if (status === 'error') {
    return (
      <BootstrapScreen
        status={status}
        progress={progress}
        message={message}
        error={error}
        onRetry={() => {}}
      />
    );
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Material3ThemeProvider>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <NavigationContainer>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </NavigationContainer>
      </Material3ThemeProvider>
    </SafeAreaProvider>
  );
}
