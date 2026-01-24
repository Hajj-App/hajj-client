/**
 * Stale Data Indicator Component
 * Shows a subtle indicator when data might be outdated
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface StaleDataIndicatorProps {
  /** Whether the data is stale */
  isStale: boolean;
  /** Whether data is currently loading */
  isLoading?: boolean;
  /** Callback to refresh data */
  onRefresh?: () => void;
  /** Custom message */
  message?: string;
}

const StaleDataIndicator: React.FC<StaleDataIndicatorProps> = ({
  isStale,
  isLoading = false,
  onRefresh,
  message = 'Data may be outdated',
}) => {
  if (!isStale && !isLoading) return null;

  return (
    <View style={styles.container}>
      {isLoading ? (
        <>
          <MaterialIcons name="sync" size={14} color="#666" />
          <Text style={styles.text}>Refreshing...</Text>
        </>
      ) : (
        <>
          <MaterialIcons name="access-time" size={14} color="#999" />
          <Text style={styles.text}>{message}</Text>
          {onRefresh && (
            <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  text: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  refreshButton: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#31C462',
    borderRadius: 3,
  },
  refreshText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
});

export default StaleDataIndicator;
