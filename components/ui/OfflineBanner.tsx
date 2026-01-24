/**
 * Offline Banner Component
 * Shows a banner when the device is offline
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface OfflineBannerProps {
  /** Custom message to display */
  message?: string;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Callback when retry is pressed */
  onRetry?: () => void;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({
  message = "You're offline. Some features may not be available.",
  showRetry = false,
  onRetry,
}) => {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const slideAnim = useRef(new Animated.Value(-60)).current;

  const isOffline = isConnected === false || isInternetReachable === false;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOffline ? 0 : -60,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline, slideAnim]);

  if (!isOffline) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.content}>
        <MaterialIcons name="cloud-off" size={20} color="#fff" />
        <Text style={styles.text}>{message}</Text>
        {showRetry && onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
            <MaterialIcons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f44336',
    paddingTop: 40, // Account for status bar
    paddingBottom: 10,
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  retryButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default OfflineBanner;
