import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { FontAwesome5 } from '@expo/vector-icons';
import { StorageFile } from '@/utils/storageTypes';
import { useTranslation } from 'react-i18next';

interface AudioPlayerModalProps {
  visible: boolean;
  audioFile: StorageFile | null;
  onClose: () => void;
}

type PlaybackStatus = {
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  rate: number;
};

const SKIP_TIME = 10000; // 10 seconds for skip forward/backward

const AudioPlayerModal: React.FC<AudioPlayerModalProps> = ({
  visible,
  audioFile,
  onClose,
}) => {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>({
    isPlaying: false,
    positionMillis: 0,
    durationMillis: 0,
    rate: 1.0,
  });
  const { t } = useTranslation();
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

      // Unload any existing sound
      await stopAudio();

      // Load the new audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioFile.downloadURL },
        { 
          shouldPlay: false,
          isLooping: false,
          volume: 1.0,
          rate: playbackStatus.rate,
          shouldCorrectPitch: true,
        },
        handlePlaybackStatusUpdate
      );

      soundRef.current = sound;
      setIsLoading(false);

    } catch (error) {
      console.error('Error loading audio:', error);
      setError('Failed to load the audio file. Please try again.');
      setIsLoading(false);
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPlaybackStatus({
        isPlaying: status.isPlaying,
        positionMillis: status.positionMillis,
        durationMillis: status.durationMillis || 0,
        rate: status.rate,
      });
      
      if (status.didJustFinish) {
        setPlaybackStatus(prev => ({
          ...prev,
          isPlaying: false,
          positionMillis: 0,
        }));
      }
    }
  };

  const stopAudio = async () => {
    try {
      if (soundRef.current) {
        // Check if sound is loaded before trying to stop/unload
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (!error.message.includes('sound is not loaded')) {
          console.error('Error stopping audio:', error);
        }
      } else {
        console.error('Unknown error stopping audio:', error);
      }
    } finally {
      soundRef.current = null;
      setPlaybackStatus({
        isPlaying: false,
        positionMillis: 0,
        durationMillis: 0,
        rate: 1.0,
      });
    }
  };

  const togglePlayPause = async () => {
    if (!soundRef.current) return;

    try {
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;

      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      setError('Failed to control audio playback. Please try again.');
    }
  };

  const handleSeek = async (value: number) => {
    if (!soundRef.current) return;
    
    try {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
        await soundRef.current.setPositionAsync(value);
      }
    } catch (error) {
      console.error('Error seeking audio:', error);
    }
  };

  const changePlaybackRate = async (rate: number) => {
    if (!soundRef.current) return;
    
    try {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
        await soundRef.current.setRateAsync(rate, true);
        setPlaybackStatus(prev => ({ ...prev, rate }));
      }
    } catch (error) {
      console.error('Error changing playback rate:', error);
    }
  };

  const skipForward = async () => {
    if (!soundRef.current) return;
    
    try {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded && status.durationMillis !== undefined) {
        const newPosition = Math.min(
          status.positionMillis + SKIP_TIME,
          status.durationMillis
        );
        await soundRef.current.setPositionAsync(newPosition);
      }
      
    } catch (error) {
      console.error('Error skipping forward:', error);
    }
  };

  const skipBackward = async () => {
    if (!soundRef.current) return;
    
    try {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
        const newPosition = Math.max(0, status.positionMillis - SKIP_TIME);
        await soundRef.current.setPositionAsync(newPosition);
      }
    } catch (error) {
      console.error('Error skipping backward:', error);
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

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
            <Text style={styles.title}>{t('audioGuide')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome5 name="times" size={20} color="#000" />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                onPress={() => setError(null)}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
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
              
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <Text style={styles.timeText}>
                  {formatTime(playbackStatus.positionMillis)}
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={playbackStatus.durationMillis || 1}
                  value={playbackStatus.positionMillis}
                  onSlidingComplete={handleSeek}
                  minimumTrackTintColor="#34D399"
                  maximumTrackTintColor="#a1a0a0"
                  thumbTintColor="#34D399"
                  disabled={isLoading}
                />
                <Text style={styles.timeText}>
                  {formatTime(playbackStatus.durationMillis)}
                </Text>
              </View>
              
              {/* Playback Controls */}
              <View style={styles.controlsRow}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={skipBackward}
                  disabled={isLoading}
                >
                  <FontAwesome5 name="backward" size={20} color="#34D399" />
                  <Text style={styles.skipText}>10s</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.playButton}
                  onPress={togglePlayPause}
                  disabled={isLoading}
                >
                  <FontAwesome5
                    name={playbackStatus.isPlaying ? 'pause' : 'play'}
                    size={24}
                    color="#fff"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={skipForward}
                  disabled={isLoading}
                >
                  <FontAwesome5 name="forward" size={20} color="#34D399" />
                  <Text style={styles.skipText}>10s</Text>
                </TouchableOpacity>
              </View>
              
              {/* Speed Controls */}
              <View style={styles.speedControls}>
                {[1.0, 1.5, 2.0].map((rate) => (
                  <TouchableOpacity
                    key={rate.toString()}
                    onPress={() => changePlaybackRate(rate)}
                    style={[
                      styles.speedButton,
                      playbackStatus.rate === rate && styles.speedButtonActive
                    ]}
                  >
                    <Text style={[
                      styles.speedButtonText,
                      playbackStatus.rate === rate && styles.speedButtonTextActive
                    ]}>
                      {rate}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  timeText: {
    width: 50,
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  controlButton: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#34D399',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  skipText: {
    color: '#34D399',
    fontSize: 12,
    marginTop: 5,
  },
  speedControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  speedButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 9999,
    backgroundColor: '#f1f1f1',
  },
  speedButtonActive: {
    backgroundColor: '#34D399',
  },
  speedButtonText: {
    color: '#80848a',
    fontWeight: 'bold',
  },
  speedButtonTextActive: {
    color: '#fff',
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
    alignItems: 'center',
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#34D399',
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AudioPlayerModal;