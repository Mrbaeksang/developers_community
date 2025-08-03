import { create } from 'zustand'

interface UIStore {
  // 사이드바 상태
  isSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // 모바일 메뉴 상태
  isMobileMenuOpen: boolean
  toggleMobileMenu: () => void
  setMobileMenuOpen: (open: boolean) => void

  // 모달 상태
  activeModal: string | null
  openModal: (modalId: string) => void
  closeModal: () => void

  // 테마 설정
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // 로딩 상태
  isGlobalLoading: boolean
  setGlobalLoading: (loading: boolean) => void

  // 토스트 메시지
  toastMessage: string | null
  toastType: 'success' | 'error' | 'info' | 'warning' | null
  showToast: (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning'
  ) => void
  hideToast: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  // 사이드바
  isSidebarOpen: true,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  // 모바일 메뉴
  isMobileMenuOpen: false,
  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

  // 모달
  activeModal: null,
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),

  // 테마
  theme: 'system',
  setTheme: (theme) => set({ theme }),

  // 로딩
  isGlobalLoading: false,
  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),

  // 토스트
  toastMessage: null,
  toastType: null,
  showToast: (message, type) => {
    set({ toastMessage: message, toastType: type })
    // 3초 후 자동으로 숨기기
    setTimeout(() => {
      set({ toastMessage: null, toastType: null })
    }, 3000)
  },
  hideToast: () => set({ toastMessage: null, toastType: null }),
}))
