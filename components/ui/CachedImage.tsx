/**
 * CachedImage Component
 * Image component with fallback support and error handling
 */
import React, { useState, useCallback } from 'react';
import { 
  Image, 
  ImageProps, 
  ImageSourcePropType, 
  View, 
  StyleSheet,
  ActivityIndicator 
} from 'react-native';
import { FALLBACK_IMAGES } from '@/constants/fallbacks';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  /** Remote URI or local source */
  uri?: string;
  /** Local source as fallback if uri fails */
  source?: ImageSourcePropType;
  /** Fallback image to show on error */
  fallback?: ImageSourcePropType;
  /** Category for automatic fallback selection */
  category?: keyof typeof FALLBACK_IMAGES;
  /** Show loading indicator */
  showLoading?: boolean;
  /** Loading indicator color */
  loadingColor?: string;
}

const CachedImage: React.FC<CachedImageProps> = ({
  uri,
  source,
  fallback,
  category,
  showLoading = true,
  loadingColor = '#31C462',
  style,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
  }, []);

  // Determine the image source
  const getImageSource = (): ImageSourcePropType => {
    if (hasError) {
      // Use explicit fallback, or category-based fallback, or default
      if (fallback) return fallback;
      if (category && FALLBACK_IMAGES[category]) return FALLBACK_IMAGES[category];
      return FALLBACK_IMAGES.RITUAL; // Default fallback
    }

    if (uri && !hasError) {
      return { uri };
    }

    if (source) {
      return source;
    }

    // No valid source, use fallback
    if (category && FALLBACK_IMAGES[category]) return FALLBACK_IMAGES[category];
    return FALLBACK_IMAGES.RITUAL;
  };

  return (
    <View style={[styles.container, style]}>
      <Image
        {...props}
        source={getImageSource()}
        style={[styles.image, style]}
        onError={handleError}
        onLoadEnd={handleLoadEnd}
        onLoadStart={handleLoadStart}
      />
      {showLoading && isLoading && !hasError && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={loadingColor} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 245, 245, 0.5)',
  },
});

export default CachedImage;
