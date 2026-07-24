import { useState, useEffect } from 'react';
import { subscribeToClients, addClient as addClientService, updateClient as updateClientService, deleteClient as deleteClientService } from '../services/clientService';
import { useAuth } from './useAuth';

export function useClients() {
  const { userId } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setClients([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    let isMounted = true;
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 500);

    const unsubscribe = subscribeToClients(userId, (data) => {
      clearTimeout(fallbackTimer);
      if (!isMounted) return;
      setClients(data);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, [userId]);

  const addClient = async (data) => {
    if (!userId) return;
    return addClientService(userId, data);
  };

  const updateClient = async (clientId, data) => {
    if (!userId) return;
    return updateClientService(userId, clientId, data);
  };

  const deleteClient = async (clientId) => {
    if (!userId) return;
    return deleteClientService(userId, clientId);
  };

  return { clients, loading, addClient, updateClient, deleteClient };
}
