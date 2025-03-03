import { Magnetometer } from 'expo-sensors';
import { useState, useEffect } from 'react';

const useCompass = () => {
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    let subscription = Magnetometer.addListener((data) => {
      const angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
      setHeading((angle + 360) % 360);
    });

    return () => subscription && subscription.remove();
  }, []);

  return heading;
};

export default useCompass;
