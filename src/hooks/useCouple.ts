import { useState, useEffect, useCallback } from 'react';
import * as coupleService from '../services/coupleService';
import { CoupleData } from '../services/coupleService';

export function useCouple(
  onDataUpdate: (data: CoupleData) => void
) {
  const [coupleId, setCoupleId] = useState<string | null>(() => {
    return localStorage.getItem('youlove_couple_id');
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse URL query parameter: room or room/couple ID from shared navigation link
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      if (urlRoom) {
        const cleanRoom = urlRoom.trim().toUpperCase();
        if (cleanRoom.startsWith('LOVE-') && cleanRoom.length >= 10) {
          localStorage.setItem('youlove_couple_id', cleanRoom);
          setCoupleId(cleanRoom);
          
          // Clear query params elegantly without triggering whole page reloads
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
    } catch (err) {
      console.error("Error reading room query parameter on init:", err);
    }
  }, []);

  // Sync state & register listeners for couples document in real-time
  useEffect(() => {
    if (!coupleId) return;

    setIsSyncing(true);
    setError(null);

    // Initial query fetch to quickly sync baseline states and verify connection
    coupleService.loadCouple(coupleId)
      .then((data) => {
        onDataUpdate(data);
        setIsSyncing(false);
      })
      .catch((err: any) => {
        console.error("Failed to load couple database baseline: ", err);
        setError(err.message || "Không thể tải dữ liệu từ phòng này.");
        setIsSyncing(false);
      });

    // Establish onSnapshot listener connection
    const unsubscribe = coupleService.subscribeCouple(coupleId, (data) => {
      onDataUpdate(data);
      // clear error upon successful syncing update
      setError(null);
    });

    return () => {
      unsubscribe();
    };
  }, [coupleId]);

  const createRoom = useCallback(async (initialData: CoupleData) => {
    setIsCreating(true);
    setError(null);
    try {
      const newId = await coupleService.createCouple(initialData);
      setCoupleId(newId);
      setIsCreating(false);
      return newId;
    } catch (err: any) {
      console.error("Room creation error:", err);
      setError(err.message || "Lỗi khi tạo phòng liên kết.");
      setIsCreating(false);
      throw err;
    }
  }, []);

  const joinRoom = useCallback(async (id: string) => {
    setIsJoining(true);
    setError(null);
    try {
      const docData = await coupleService.joinCouple(id);
      onDataUpdate(docData);
      const sanitizedId = id.trim().toUpperCase();
      setCoupleId(sanitizedId);
      setIsJoining(false);
      return sanitizedId;
    } catch (err: any) {
      console.error("Room joining error:", err);
      setError(err.message || "Lỗi khi tham gia phòng liên kết.");
      setIsJoining(false);
      throw err;
    }
  }, [onDataUpdate]);

  const updateRoom = useCallback(async (data: Partial<CoupleData>) => {
    if (!coupleId) return;
    try {
      await coupleService.saveCouple(coupleId, data);
    } catch (err: any) {
      console.error("Room saving error:", err);
      setError(err.message || "Không thể đồng bộ dữ liệu lên đám mây.");
    }
  }, [coupleId]);

  const disconnectRoom = useCallback(() => {
    localStorage.removeItem('youlove_couple_id');
    setCoupleId(null);
    setError(null);
  }, []);

  return {
    coupleId,
    isCreating,
    isJoining,
    isSyncing,
    error,
    setError,
    createRoom,
    joinRoom,
    updateRoom,
    disconnectRoom,
    shareLink: coupleId ? coupleService.generateShareLink(coupleId) : ''
  };
}
