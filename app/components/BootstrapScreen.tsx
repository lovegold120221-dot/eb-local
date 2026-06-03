import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {useAppTheme} from '../theme/ThemeContext';
import type {BootstrapStatus} from '../bootstrap/useEburonBootstrap';

interface Props {
  status: BootstrapStatus;
  progress: number;
  message: string;
  error: string | null;
  onRetry: () => void;
}

export default function BootstrapScreen({
  status,
  progress,
  message,
  error,
  onRetry,
}: Props) {
  const theme = useAppTheme();

  const getTitle = () => {
    switch (status) {
      case 'starting-service':
        return 'Starting Eburon AI';
      case 'checking-model':
        return 'Checking Model';
      case 'downloading-model':
        return 'Downloading Eburon Max';
      case 'ready':
        return 'Ready';
      case 'error':
        return 'Setup Error';
      default:
        return 'Preparing...';
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <Text style={[styles.title, {color: theme.colors.primary}]}>
        Eburon AI
      </Text>
      <Text style={[styles.heading, {color: theme.colors.onSurface}]}>
        {getTitle()}
      </Text>

      {(status === 'downloading-model' || status === 'checking-model' || status === 'starting-service') && (
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressTrack,
              {backgroundColor: theme.colors.surface},
            ]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.colors.primary,
                  width: `${Math.min(progress * 100, 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, {color: theme.colors.onSurface}]}>
            {Math.round(Math.min(progress * 100, 100))}%
          </Text>
        </View>
      )}

      <Text style={[styles.message, {color: theme.colors.onSurface}]}>
        {message}
      </Text>

      {status === 'downloading-model' && (
        <Text style={[styles.hint, {color: theme.colors.onSurface}]}>
          This is a one-time setup. The model (~1.1 GB) is stored locally on your
          device. Keep the app open and use Wi-Fi.
        </Text>
      )}

      {status === 'error' && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, {color: theme.colors.error}]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, {backgroundColor: theme.colors.primary}]}
            onPress={onRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: 2,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 8,
    lineHeight: 20,
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 16,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
