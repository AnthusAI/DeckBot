import { create } from 'zustand'
import type { Message, ImageCandidate, ImageRequestDetails } from '../types/Chat'

interface ChatState {
  messages: Message[]
  isThinking: boolean
  currentBatchSlug: string | null
  imageRequestDetails: ImageRequestDetails | null
  imageCandidates: ImageCandidate[]
  selectedImageIndex: number | null
  
  // Actions
  addMessage: (message: Message) => void
  clearMessages: () => void
  setMessages: (messages: Message[]) => void
  setThinking: (thinking: boolean) => void
  setImageRequestDetails: (details: ImageRequestDetails | null) => void
  addImageCandidate: (candidate: ImageCandidate) => void
  clearImageCandidates: () => void
  setSelectedImageIndex: (index: number | null) => void
  setCurrentBatchSlug: (slug: string | null) => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isThinking: false,
  currentBatchSlug: null,
  imageRequestDetails: null,
  imageCandidates: [],
  selectedImageIndex: null,
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  clearMessages: () => set({ messages: [] }),
  
  setMessages: (messages) => set({ messages }),
  
  setThinking: (thinking) => set({ isThinking: thinking }),
  
  setImageRequestDetails: (details) => set({ imageRequestDetails: details }),
  
  addImageCandidate: (candidate) => set((state) => ({
    imageCandidates: [...state.imageCandidates, candidate]
  })),
  
  clearImageCandidates: () => set({ 
    imageCandidates: [],
    imageRequestDetails: null,
    selectedImageIndex: null,
    currentBatchSlug: null,
  }),
  
  setSelectedImageIndex: (index) => set({ selectedImageIndex: index }),
  
  setCurrentBatchSlug: (slug) => set({ currentBatchSlug: slug }),
}))

