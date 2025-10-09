/**
 * UI Store (Zustand)
 * @description UI 상태 관리를 위한 Zustand 스토어
 */

import { create } from 'zustand';

// UI 상태 인터페이스
interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

// Zustand UI 스토어 생성
export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,

  // 사이드바 토글
  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  // 사이드바 상태 설정
  setSidebarCollapsed: (collapsed: boolean) => {
    set({ sidebarCollapsed: collapsed });
  },
}));
