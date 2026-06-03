import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {login, register, hasAccount} from '../auth/localAuth';
import {useAppTheme} from '../theme/ThemeContext';
import {useAuth} from '../auth/AuthProvider';
import type {LocalUser} from '../auth/localAuth';

export default function LoginScreen() {
  const theme = useAppTheme();
  const {user: _, initializing: __} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasExisting, setHasExisting] = useState<boolean | null>(null);

  React.useEffect(() => {
    hasAccount().then(setHasExisting);
  }, []);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      // AuthProvider will re-render with user
    } catch (e: any) {
      Alert.alert('Login Failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password);
      // AuthProvider will re-render with user
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <Text style={[styles.title, {color: theme.colors.primary}]}>
          Eburon AI
        </Text>
        <Text style={[styles.subtitle, {color: theme.colors.onSurface}]}>
          Welcome to Eburon AI
        </Text>
        <Text style={[styles.hint, {color: theme.colors.onSurface}]}>
          Your account lives only on this device. No cloud, no tracking.
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.onSurface,
              borderColor: theme.colors.surfaceVariant,
            },
          ]}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.onSurface,
              borderColor: theme.colors.surfaceVariant,
            },
          ]}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, {backgroundColor: theme.colors.primary}]}
          onPress={handleLogin}
          disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        {!hasExisting && (
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={handleRegister}
            disabled={loading}>
            <Text
              style={[styles.buttonTextSecondary, {color: theme.colors.primary}]}>
              Create Account
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  inner: {flex: 1, justifyContent: 'center', paddingHorizontal: 32},
  title: {fontSize: 36, fontWeight: '800', textAlign: 'center', marginBottom: 8, letterSpacing: 2},
  subtitle: {fontSize: 16, textAlign: 'center', marginBottom: 8, opacity: 0.7},
  hint: {fontSize: 12, textAlign: 'center', marginBottom: 32, opacity: 0.5, lineHeight: 18},
  input: {borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 16},
  button: {borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8},
  buttonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
  buttonSecondary: {borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 12},
  buttonTextSecondary: {fontSize: 14, fontWeight: '500'},
});
