import { useState, useRef, useEffect, useCallback } from "react";

interface UseWebSocketOptions {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
}

export default function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoReconnect = true,
    maxReconnectAttempts = 5,
    reconnectInterval = 3000
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const getWebSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WEBSOCKET_HOST || 'localhost';
    const port = process.env.NEXT_PUBLIC_WEBSOCKET_PORT || '8080';
    return `${protocol}//${host}:${port}`;
  };

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      const wsUrl = getWebSocketUrl();
      console.log('Connecting to WebSocket:', wsUrl);
      
      const webSocket = new WebSocket(wsUrl);
      socketRef.current = webSocket;

      webSocket.onopen = () => {
        console.log('WebSocket connected');
        if (mountedRef.current) {
          setIsConnected(true);
          setReconnectAttempts(0);
        }
      };

      webSocket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        if (mountedRef.current) {
          setIsConnected(false);
          
          // Auto-reconnect if enabled and not a normal closure
          if (autoReconnect && event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
            console.log(`Attempting to reconnect (${reconnectAttempts + 1}/${maxReconnectAttempts})...`);
            reconnectTimeoutRef.current = setTimeout(() => {
              setReconnectAttempts(prev => prev + 1);
              connect();
            }, reconnectInterval);
          }
        }
      };

      webSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (mountedRef.current) {
          setIsConnected(false);
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      if (mountedRef.current) {
        setIsConnected(false);
      }
    }
  }, [autoReconnect, maxReconnectAttempts, reconnectInterval, reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.close(1000, 'Manual disconnect');
      socketRef.current = null;
    }
    
    setIsConnected(false);
    setReconnectAttempts(0);
  }, []);

  // Initial connection
  useEffect(() => {
    connect();

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return { 
    socket: socketRef.current, 
    isConnected,
    reconnectAttempts,
    connect,
    disconnect
  };
}