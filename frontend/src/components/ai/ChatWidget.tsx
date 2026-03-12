'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Mic, MicOff, Loader2, Bot, User, Sparkles } from 'lucide-react'
import { useChatStore } from '@/lib/store'
import { sendChat, getChatSuggestions } from '@/lib/api'
import { getSessionId } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

type SpeechRecognition = any

export default function ChatWidget() {
  const { messages, isOpen, isLoading, addMessage, setLoading, toggleChat, clearMessages } = useChatStore()
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition>(null)
  const isListeningRef = useRef(false)
  const router = useRouter()

  useEffect(() => { isListeningRef.current = isListening }, [isListening])

  useEffect(() => {
    getChatSuggestions()
      .then(data => setSuggestions(data.suggestions?.slice(0, 4) || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // sendMessage ka latest ref — voice callback mein stale closure problem hoti hai
  const sendMessageRef = useRef<(text: string) => void>(() => {})

  const startVoice = useCallback(() => {
    if (typeof window === 'undefined') return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      alert('Voice sirf Chrome mein kaam karta hai.')
      return
    }

    const recognition = new SR()

    // continuous = false — ek sentence bolta hai, ruk jaata hai, send hota hai
    // Jarvis mein bhi yahi tha — ek baar bolo, process ho, phir dobara suno
    recognition.continuous = false
    recognition.interimResults = true   // interim results → input box mein live dikhega
    recognition.lang = 'en-IN'
    recognition.maxAlternatives = 1

    // Interim results → input box mein live dikhao (user dekh sake kya sun raha hai)
    // Final result → automatically send karo (user ko Enter nahi dabaana)
    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += text
        } else {
          interim += text   // abhi bol raha hai — live dikhao
        }
      }

      // Interim → input box mein live dikhao
      if (interim) {
        setTranscript(interim)
        setInput(interim)
      }

      // Final → input mein set karo aur automatically send karo
      if (final.trim()) {
        const cleanText = final.trim()
        setTranscript(cleanText)
        setInput(cleanText)

        // Thoda wait karo taaki user dekh sake kya bola
        // Phir automatically send karo — user ko Enter nahi dabaana
        setTimeout(() => {
          sendMessageRef.current(cleanText)
        }, 400)
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      console.warn('Voice error:', event.error)
      setIsListening(false)
      isListeningRef.current = false
      setTranscript('')
    }

    recognition.onend = () => {
      // Abhi bhi listening mode mein hain → restart karo (Jarvis jaisa loop)
      if (isListeningRef.current) {
        try {
          setTimeout(() => recognition.start(), 100)
        } catch (_) {}
      } else {
        setIsListening(false)
        setTranscript('')
      }
    }

    recognitionRef.current = recognition
    isListeningRef.current = true
    setIsListening(true)
    recognition.start()
  }, [])

  const handleVoice = () => {
    if (isListening) {
      // Band karo
      isListeningRef.current = false
      setIsListening(false)
      recognitionRef.current?.stop()
      recognitionRef.current = null
      setTranscript('')
      setInput('')
      return
    }
    startVoice()
  }

  const ACTION_REGISTRY: Record<string, (data: any) => void> = {
    SEARCH: (data) => router.push(`/products?search=${encodeURIComponent(data?.query || '')}`),
    FILTER_CATEGORY: (data) => router.push(`/products?category=${data?.slug || ''}`),
    FILTER_PRICE: (data) => router.push(`/products?min_price=${data?.min ?? 0}&max_price=${data?.max ?? 99999}`),
    SORT: (data) => router.push(`/products?sort=${data?.by || 'newest'}`),
    OPEN_PRODUCT: (data) => { if (data?.id) router.push(`/products/${data.id}`) },
    NAVIGATE: (data) => { if (data?.path) router.push(data.path) },
    SCROLL: (data) => window.scrollBy({ top: data?.direction === 'up' ? -400 : 400, behavior: 'smooth' }),
    ADD_TO_CART: (data) => { if (data?.product_id) router.push(`/products/${data.product_id}`) },
  }

  const executeAction = useCallback((action: { type: string; data?: any }) => {
    if (!action?.type) return
    const handler = ACTION_REGISTRY[action.type]
    if (handler) handler(action.data)
    else console.warn(`[ShopMind] Unknown action: "${action.type}"`)
  }, [router])

  // sendMessageRef ko latest sendMessage se sync karo
  // Voice callback mein stale closure nahi hogi
  useEffect(() => {
    sendMessageRef.current = (text: string) => sendMessage(text)
  })

  const sendMessage = async (text?: string) => {
    const message = (text || transcript || input).trim()
    if (!message || isLoading) return

    // Voice band mat karo — user ne khud band nahi kiya
    // Sirf input/transcript clear karo taaki next sentence ke liye ready rahe
    setInput('')
    setTranscript('')
    addMessage({ role: 'user', content: message })
    setLoading(true)

    try {
      const sessionId = getSessionId()
      const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }))
      const response = await sendChat({ message, session_id: sessionId, history })

      addMessage({
        role: 'assistant',
        content: response.reply || "Sorry, kuch problem aayi.",
        action: response.action,
      })

      if (response.action && response.action.type !== 'NONE') {
        setTimeout(() => executeAction(response.action), 500)
      }
    } catch (e) {
      addMessage({
        role: 'assistant',
        content: "Backend se connect nahi ho pa raha. Check karo backend chal raha hai.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  if (!isOpen) {
    return (
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl transition-all duration-300 flex items-center justify-center overflow-hidden"
        style={{background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #c8965a 100%)'}}
        title="Open AI Shopping Assistant"
      >
        {/* AI Brain SVG thumbnail */}
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Outer glow ring */}
          <circle cx="15" cy="15" r="13" stroke="#c8965a" strokeWidth="0.8" strokeOpacity="0.5"/>
          {/* Brain / circuit nodes */}
          <circle cx="15" cy="9" r="2" fill="#c8965a"/>
          <circle cx="9" cy="15" r="2" fill="#c8965a" fillOpacity="0.8"/>
          <circle cx="21" cy="15" r="2" fill="#c8965a" fillOpacity="0.8"/>
          <circle cx="11" cy="21" r="2" fill="#c8965a" fillOpacity="0.6"/>
          <circle cx="19" cy="21" r="2" fill="#c8965a" fillOpacity="0.6"/>
          <circle cx="15" cy="15" r="2.5" fill="#e8b87a"/>
          {/* Connecting lines */}
          <line x1="15" y1="11" x2="15" y2="12.5" stroke="#c8965a" strokeWidth="0.8" strokeOpacity="0.7"/>
          <line x1="11" y1="15" x2="12.5" y2="15" stroke="#c8965a" strokeWidth="0.8" strokeOpacity="0.7"/>
          <line x1="17.5" y1="15" x2="19" y2="15" stroke="#c8965a" strokeWidth="0.8" strokeOpacity="0.7"/>
          <line x1="13" y1="17" x2="11.5" y2="20" stroke="#c8965a" strokeWidth="0.8" strokeOpacity="0.5"/>
          <line x1="17" y1="17" x2="18.5" y2="20" stroke="#c8965a" strokeWidth="0.8" strokeOpacity="0.5"/>
          {/* Pulse ring */}
          <circle cx="15" cy="15" r="5" stroke="#e8b87a" strokeWidth="0.5" strokeOpacity="0.4" strokeDasharray="2 2"/>
        </svg>
        <span className="absolute top-0 right-0 w-3 h-3 bg-accent rounded-full border-2 border-stone animate-pulse" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-mist animate-slide-up">

      {/* Header */}
      <div className="bg-ink px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{background: 'linear-gradient(135deg, #1a1a2e 0%, #c8965a 100%)'}}>
            <svg width="18" height="18" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="15" cy="9" r="2" fill="#fff"/>
              <circle cx="9" cy="15" r="2" fill="#fff" fillOpacity="0.8"/>
              <circle cx="21" cy="15" r="2" fill="#fff" fillOpacity="0.8"/>
              <circle cx="11" cy="21" r="2" fill="#fff" fillOpacity="0.6"/>
              <circle cx="19" cy="21" r="2" fill="#fff" fillOpacity="0.6"/>
              <circle cx="15" cy="15" r="2.5" fill="#e8b87a"/>
              <line x1="15" y1="11" x2="15" y2="12.5" stroke="#fff" strokeWidth="0.8" strokeOpacity="0.7"/>
              <line x1="11" y1="15" x2="12.5" y2="15" stroke="#fff" strokeWidth="0.8" strokeOpacity="0.7"/>
              <line x1="17.5" y1="15" x2="19" y2="15" stroke="#fff" strokeWidth="0.8" strokeOpacity="0.7"/>
              <line x1="13" y1="17" x2="11.5" y2="20" stroke="#fff" strokeWidth="0.8" strokeOpacity="0.5"/>
              <line x1="17" y1="17" x2="18.5" y2="20" stroke="#fff" strokeWidth="0.8" strokeOpacity="0.5"/>
            </svg>
          </div>
          <div>
            <p className="text-stone text-sm font-semibold">ShopMind AI</p>
            <p className="text-stone/50 text-[10px]">
              {isListening ? '🎤 Sun raha hoon...' : 'Your shopping assistant'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearMessages} className="text-stone/40 hover:text-stone/70 text-[11px] transition-colors">Clear</button>
          <button onClick={toggleChat} className="p-1.5 text-stone/60 hover:text-stone rounded-full hover:bg-stone/10 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto bg-white p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-stone rounded-full flex items-center justify-center mx-auto mb-3">
              <Bot size={20} className="text-accent" />
            </div>
            <p className="text-sm text-ink/70 font-medium mb-1">Hi! I'm ShopMind</p>
            <p className="text-xs text-ink/40 mb-4">Ask me anything or press 🎤 for voice</p>
            <div className="space-y-1.5">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)}
                  className="w-full text-left text-xs bg-stone hover:bg-mist rounded-lg px-3 py-2 text-ink/70 hover:text-ink transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
            <div className={cn('w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5',
              msg.role === 'user' ? 'bg-accent text-white' : 'bg-stone text-accent')}>
              {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
            </div>
            <div className={cn('max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-relaxed',
              msg.role === 'user' ? 'bg-ink text-stone rounded-tr-sm' : 'bg-stone text-ink rounded-tl-sm')}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.action && msg.action.type !== 'NONE' && (
                <div className="mt-1.5 pt-1.5 border-t border-mist">
                  <span className="text-[10px] text-accent font-medium">✓ {msg.action.type.replace(/_/g, ' ')}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-stone flex items-center justify-center">
              <Bot size={12} className="text-accent" />
            </div>
            <div className="bg-stone rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
              <span className="typing-dot w-1.5 h-1.5 bg-ink/30 rounded-full" />
              <span className="typing-dot w-1.5 h-1.5 bg-ink/30 rounded-full" />
              <span className="typing-dot w-1.5 h-1.5 bg-ink/30 rounded-full" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Transcript preview */}
      {(isListening || transcript) && (
        <div className="bg-accent/10 px-4 py-2 border-t border-accent/20">
          <p className="text-xs text-accent">
            {isListening && !transcript ? '🎤 Bol sakte hain...' : `"${transcript}"`}
          </p>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-mist px-3 py-2.5 flex items-center gap-2">
        <button onClick={handleVoice}
          className={cn('relative p-2 rounded-full flex-shrink-0 transition-all',
            isListening ? 'bg-red-100 text-red-500' : 'bg-stone text-ink/60 hover:text-ink hover:bg-mist')}
          title={isListening ? 'Rokne ke liye click karo' : 'Voice shuru karo'}>
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          {isListening && <span className="absolute inset-0 rounded-full bg-red-400 opacity-30 voice-pulse" />}
        </button>

        <input
          value={transcript || input}
          onChange={e => { setInput(e.target.value); setTranscript('') }}
          onKeyDown={handleKey}
          placeholder={isListening ? 'Sun raha hoon...' : 'Kuch bhi poochho...'}
          className="flex-1 text-xs bg-stone rounded-full px-3 py-2 outline-none placeholder:text-ink/30"
        />

        <button onClick={() => sendMessage()}
          disabled={!(transcript || input).trim() || isLoading}
          className={cn('p-2 rounded-full flex-shrink-0 transition-all',
            (transcript || input).trim() && !isLoading
              ? 'bg-ink text-stone hover:bg-accent'
              : 'bg-stone text-ink/30 cursor-not-allowed')}>
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )
}