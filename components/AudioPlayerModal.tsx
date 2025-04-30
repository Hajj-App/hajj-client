import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { FontAwesome5 } from '@expo/vector-icons';
import { StorageFile } from '@/utils/storageTypes';

interface AudioPlayerModalProps {
  visible: boolean;
  audioFile: StorageFile | null;
  onClose: () => void;
}

const AudioPlayerModal: React.FC<AudioPlayerModalProps> = ({
  visible,
  audioFile,
  onClose,
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error("Error setting up audio mode:", error);
      }
    };

    setupAudio();
  }, []);

  useEffect(() => {
    if (visible && audioFile) {
      loadAndPlayAudio();
    } else {
      stopAudio();
    }

    return () => {
      stopAudio();
    };
  }, [visible, audioFile]);

  const loadAndPlayAudio = async () => {
    if (!audioFile) return;

    try {
      setIsLoading(true);
      setError(null);
      setIsBuffering(true);

      // Unload any existing sound
      if (sound) {
        await sound.unloadAsync();
      }

      // Load and play the new audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioFile.downloadURL },
        { 
          shouldPlay: true,
          isLooping: false,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: true,
        },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setIsPlaying(true);
      setIsLoading(false);
      setIsBuffering(false);
    } catch (error) {
      console.error('Error playing audio:', error);
      setError('Failed to play the audio file. Please try again.');
      setIsLoading(false);
      setIsBuffering(false);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsBuffering(status.isBuffering);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    }
  };

  const stopAudio = async () => {
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
      // Don't throw error, just clean up the state
    } finally {
      setSound(null);
      setIsPlaying(false);
      setPosition(0);
    }
  };

  const togglePlayPause = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      setError('Failed to control audio playback. Please try again.');
    }
  };

  const togglePlaybackSpeed = async () => {
    if (!sound) return;

    try {
      const newRate = playbackRate === 1.0 ? 2.0 : 1.0;
      await sound.setRateAsync(newRate, true);
      setPlaybackRate(newRate);
    } catch (error) {
      console.error('Error changing playback speed:', error);
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (position / duration) * 100 : 0;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Audio Guide</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome5 name="times" size={20} color="#000" />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#34D399" />
              <Text style={styles.loadingText}>Loading audio...</Text>
            </View>
          ) : (
            <View style={styles.playerContainer}>
              <Text style={styles.audioName} numberOfLines={1}>
                {audioFile?.name || 'Unknown Audio'}
              </Text>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${progress}%` }
                    ]} 
                  />
                </View>
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{formatTime(position)}</Text>
                  <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
              </View>

              <View style={styles.controlsContainer}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => {
                    if (sound) {
                      sound.setPositionAsync(Math.max(0, position - 10000));
                    }
                  }}
                >
                  <FontAwesome5 name="backward" size={20} color="#34D399" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.playButton}
                  onPress={togglePlayPause}
                  disabled={isBuffering}
                >
                  {isBuffering ? (
                    <ActivityIndicator size="large" color="#fff" />
                  ) : (
                    <FontAwesome5
                      name={isPlaying ? 'pause' : 'play'}
                      size={24}
                      color="#fff"
                    />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => {
                    if (sound) {
                      sound.setPositionAsync(Math.min(duration, position + 10000));
                    }
                  }}
                >
                  <FontAwesome5 name="forward" size={20} color="#34D399" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.speedButton}
                onPress={togglePlaybackSpeed}
                disabled={isBuffering}
              >
                <Text style={styles.speedText}>{playbackRate}x</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  playerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  audioName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#34D399',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#34D399',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 15,
    borderRadius: 10,
    marginVertical: 20,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
  },
  speedButton: {
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 15,
  },
  speedText: {
    color: '#34D399',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default AudioPlayerModal; 