import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useAppTheme} from '../theme/ThemeContext';

export default function SplashScreen() {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, {backgroundColor: '#000000'}]}>
      <Text style={styles.title}>Eburon AI</Text>
      <ActivityIndicator
        size="large"
        color={theme.colors.primary}
        style={styles.spinner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  spinner: {
    marginTop: 32,
  },
});
