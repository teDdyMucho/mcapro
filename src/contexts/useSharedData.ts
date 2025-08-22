import { useContext } from 'react';
import { SharedDataContext } from './SharedDataContext';

export function useSharedData() {
  const context = useContext(SharedDataContext);
  if (context === undefined) {
    throw new Error('useSharedData must be used within a SharedDataProvider');
  }
  return context;
}
