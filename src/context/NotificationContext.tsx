import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext.js';
import { apiFetch } from '../services/api.js';

interface NotificationContextType {
  lastPaidTransactionId: number | null;
}

const NotificationContext = createContext<NotificationContextType>({ lastPaidTransactionId: null });

export const useNotification = () => useContext(NotificationContext);

// Base64 short "ding" sound
const SUCCESS_SOUND_B64 = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU5LjE2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAJAAAFkAAWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZGRkZAAAAAAAAAAAAAAAAAAAAAP/7UGQAAAQhBEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAAD//7UmQAAAQgAkwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAAD//7UmQAAAQgAkwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAAD//7UmQAAAQgAkwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAAD//7UmQAAAQgAkwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAAD//7UmQAAAQgAkwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAAD//7UmQAAAQgAkwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAAD//7UGQAAAQgAkwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAADhGEwAAIgAAHCEJgAARAAAOEYTAAAiAAAcIQmAABEAAD";

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [lastPaidTransactionId, setLastPaidTransactionId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Track if it's the very first load to prevent sound spam
  const isInitialLoad = useRef(true);

  useEffect(() => {
    // Create an audio instance
    audioRef.current = new Audio(SUCCESS_SOUND_B64);
  }, []);

  const playSuccessSound = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0.8;
      audioRef.current.play().catch(e => console.log('Audio autoplay prevented by browser:', e));
    }
  };

  useEffect(() => {
    // Only KASIR, ADMIN, and OPERATOR should get polling notifications
    if (!user || (user.role !== 'ADMIN' && user.role !== 'OPERATOR' && user.role !== 'KASIR')) {
      return;
    }

    const pollLatestTransaction = async () => {
      try {
        const res = await apiFetch('/transactions/latest-paid');
        if (res.success && res.data && res.data.id) {
          const currentLatestId = res.data.id;
          
          setLastPaidTransactionId((prevId) => {
            if (isInitialLoad.current) {
              isInitialLoad.current = false;
              return currentLatestId;
            }

            if (prevId !== null && currentLatestId > prevId) {
              // We have a new paid transaction!
              playSuccessSound();
              
              // We could also show a toast here if we had a toast library.
              // For now, we rely on the Audio sound as the primary cue.
              console.log('🔔 NEW PAYMENT RECEIVED! ID:', currentLatestId);
            }
            return currentLatestId;
          });
        } else {
            isInitialLoad.current = false;
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    // Poll immediately, then every 5 seconds
    pollLatestTransaction();
    const interval = setInterval(pollLatestTransaction, 5000);

    return () => clearInterval(interval);
  }, [user]);

  return (
    <NotificationContext.Provider value={{ lastPaidTransactionId }}>
      {children}
    </NotificationContext.Provider>
  );
};
