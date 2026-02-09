import React, { useState, useRef, useEffect } from "react"
import lottie from "lottie-web"
import { config } from "./config"
import type { Message } from "./types"

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [streamingText, setStreamingText] = useState("")
    const [streamingMessageIndex, setStreamingMessageIndex] = useState<
        number | null
    >(null)
    const [streamingCaptionText, setStreamingCaptionText] = useState("")
    const [isStreaming, setIsStreaming] = useState(false)
    const [isCaptionStreaming, setIsCaptionStreaming] = useState(false)
    const [usedQuickMessages, setUsedQuickMessages] = useState<Set<number>>(
        new Set()
    )
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [lightboxMedia, setLightboxMedia] = useState<
        Array<{ url: string; type: "image" | "video" }>
    >([])
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
    const [hasAnimated, setHasAnimated] = useState(false)
    const [gifKey, setGifKey] = useState(0)
    const [showConfetti, setShowConfetti] = useState(false)
    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const scrollTimeoutRef = useRef<number | null>(null)
    const isUserScrollingRef = useRef(false)
    const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map())
    const mediaScrollRefs = useRef<Map<number, HTMLDivElement>>(new Map())
    const lottieContainerRef = useRef<HTMLDivElement>(null)
    const quickMessagesScrollRef = useRef<HTMLDivElement>(null)

    const quickMessages = config.quickMessages.filter(
        (msg) => msg.text && msg.text.trim() !== ""
    )

    const hasMessages = messages.length > 0

    useEffect(() => {
        setGifKey(Date.now())
    }, [])

    // Play lottie animation when showConfetti changes
    useEffect(() => {
        if (
            showConfetti &&
            lottieContainerRef.current &&
            config.specialResponses.greetingLottie
        ) {
            const anim = lottie.loadAnimation({
                container: lottieContainerRef.current,
                renderer: "svg",
                loop: false,
                autoplay: true,
                path: config.specialResponses.greetingLottie,
            })

            anim.addEventListener("complete", () => {
                setShowConfetti(false)
            })

            return () => {
                if (anim) anim.destroy()
            }
        }
    }, [showConfetti])

    // Horizontal scroll with mouse wheel for quick messages
    useEffect(() => {
        const container = quickMessagesScrollRef.current
        if (!container) return

        const handleWheel = (e: WheelEvent) => {
            if (e.deltaY !== 0) {
                e.preventDefault()
                container.scrollLeft += e.deltaY
            }
        }

        container.addEventListener("wheel", handleWheel, { passive: false })
        return () => container.removeEventListener("wheel", handleWheel)
    }, [])

    // Drag to scroll for quick messages
    useEffect(() => {
        const container = quickMessagesScrollRef.current
        if (!container) return

        let isDragging = false
        let startX = 0
        let scrollLeft = 0

        const handleMouseDown = (e: MouseEvent) => {
            isDragging = true
            container.style.cursor = "grabbing"
            container.style.userSelect = "none"
            startX = e.pageX - container.offsetLeft
            scrollLeft = container.scrollLeft
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return
            e.preventDefault()
            const x = e.pageX - container.offsetLeft
            const walk = (x - startX) * 2
            container.scrollLeft = scrollLeft - walk
        }

        const handleMouseUp = () => {
            isDragging = false
            container.style.cursor = "grab"
            container.style.userSelect = "auto"
        }

        const handleMouseLeave = () => {
            if (isDragging) {
                isDragging = false
                container.style.cursor = "grab"
                container.style.userSelect = "auto"
            }
        }

        container.addEventListener("mousedown", handleMouseDown)
        container.addEventListener("mousemove", handleMouseMove)
        container.addEventListener("mouseup", handleMouseUp)
        container.addEventListener("mouseleave", handleMouseLeave)

        return () => {
            container.removeEventListener("mousedown", handleMouseDown)
            container.removeEventListener("mousemove", handleMouseMove)
            container.removeEventListener("mouseup", handleMouseUp)
            container.removeEventListener("mouseleave", handleMouseLeave)
        }
    }, [])

    // Horizontal scroll with mouse wheel, drag AND TOUCH for media galleries
    useEffect(() => {
        const containers = Array.from(mediaScrollRefs.current.values())
        const cleanupFunctions: Array<() => void> = []

        containers.forEach((container) => {
            if (!container) return

            // Wheel handler
            const handleWheel = (e: WheelEvent) => {
                if (e.deltaY !== 0) {
                    e.preventDefault()
                    container.scrollLeft += e.deltaY
                }
            }

            // Mouse drag handlers
            let isDragging = false
            let startX = 0
            let scrollLeft = 0

            const handleMouseDown = (e: MouseEvent) => {
                isDragging = true
                container.style.cursor = "grabbing"
                container.style.userSelect = "none"
                startX = e.pageX - container.offsetLeft
                scrollLeft = container.scrollLeft
            }

            const handleMouseMove = (e: MouseEvent) => {
                if (!isDragging) return
                e.preventDefault()
                const x = e.pageX - container.offsetLeft
                const walk = (x - startX) * 2
                container.scrollLeft = scrollLeft - walk
            }

            const handleMouseUp = () => {
                isDragging = false
                container.style.cursor = "grab"
                container.style.userSelect = "auto"
            }

            const handleMouseLeave = () => {
                if (isDragging) {
                    isDragging = false
                    container.style.cursor = "grab"
                    container.style.userSelect = "auto"
                }
            }

            // Touch swipe handlers for mobile
            let touchStartX = 0
            let touchScrollLeft = 0
            let isTouching = false

            const handleTouchStart = (e: TouchEvent) => {
                isTouching = true
                touchStartX = e.touches[0].pageX
                touchScrollLeft = container.scrollLeft
            }

            const handleTouchMove = (e: TouchEvent) => {
                if (!isTouching) return
                const touchX = e.touches[0].pageX
                const walk = (touchStartX - touchX) * 1.5
                container.scrollLeft = touchScrollLeft + walk
            }

            const handleTouchEnd = () => {
                isTouching = false
            }

            container.addEventListener("wheel", handleWheel, { passive: false })
            container.addEventListener("mousedown", handleMouseDown)
            container.addEventListener("mousemove", handleMouseMove)
            container.addEventListener("mouseup", handleMouseUp)
            container.addEventListener("mouseleave", handleMouseLeave)
            container.addEventListener("touchstart", handleTouchStart, {
                passive: true,
            })
            container.addEventListener("touchmove", handleTouchMove, {
                passive: true,
            })
            container.addEventListener("touchend", handleTouchEnd, {
                passive: true,
            })

            cleanupFunctions.push(() => {
                container.removeEventListener("wheel", handleWheel)
                container.removeEventListener("mousedown", handleMouseDown)
                container.removeEventListener("mousemove", handleMouseMove)
                container.removeEventListener("mouseup", handleMouseUp)
                container.removeEventListener("mouseleave", handleMouseLeave)
                container.removeEventListener("touchstart", handleTouchStart)
                container.removeEventListener("touchmove", handleTouchMove)
                container.removeEventListener("touchend", handleTouchEnd)
            })
        })

        return () => {
            cleanupFunctions.forEach((cleanup) => cleanup())
        }
    }, [messages])

    // Auto-scroll for media galleries
    useEffect(() => {
        if (!config.input.mediaGalleryAutoScroll) return

        const intervals: number[] = []

        mediaScrollRefs.current.forEach((container) => {
            if (!container) return

            const scrollWidth = container.scrollWidth
            const clientWidth = container.clientWidth

            if (scrollWidth <= clientWidth) return

            const interval = window.setInterval(() => {
                if (!container) return

                const currentScroll = container.scrollLeft
                const maxScroll = scrollWidth - clientWidth

                if (currentScroll >= maxScroll) {
                    container.scrollLeft = 0
                } else {
                    container.scrollLeft += 1
                }
            }, config.input.mediaGalleryScrollSpeed)

            intervals.push(interval)
        })

        return () => {
            intervals.forEach((interval) => clearInterval(interval))
        }
    }, [messages])

    const scrollToBottom = (force = false) => {
        if (scrollTimeoutRef.current) {
            cancelAnimationFrame(scrollTimeoutRef.current)
        }

        scrollTimeoutRef.current = requestAnimationFrame(() => {
            if (
                messagesContainerRef.current &&
                (force || !isUserScrollingRef.current)
            ) {
                messagesContainerRef.current.scrollTop =
                    messagesContainerRef.current.scrollHeight
            }
        })
    }

    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } =
                messagesContainerRef.current
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
            isUserScrollingRef.current = !isAtBottom
        }
    }

    useEffect(() => {
        scrollToBottom(true)
    }, [messages, loading])

    useEffect(() => {
        if (isStreaming || isCaptionStreaming) {
            scrollToBottom()
        }
    }, [streamingText, streamingCaptionText])

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            const newHeight = Math.min(textareaRef.current.scrollHeight, 200)
            textareaRef.current.style.height = newHeight + "px"
        }
    }, [input])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!lightboxOpen) return

            if (e.key === "Escape") {
                closeLightbox()
            } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault()
                goToNextMedia()
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault()
                goToPrevMedia()
            } else if (e.key === "Home") {
                e.preventDefault()
                setCurrentMediaIndex(0)
            } else if (e.key === "End") {
                e.preventDefault()
                setCurrentMediaIndex(lightboxMedia.length - 1)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [lightboxOpen, lightboxMedia.length])

    useEffect(() => {
        if (hasMessages && !hasAnimated) {
            setHasAnimated(true)
        }
    }, [hasMessages, hasAnimated])

    const streamText = (text: string, messageIndex: number) => {
        setIsStreaming(true)
        setStreamingText("")
        setStreamingMessageIndex(messageIndex)
        let index = 0
        const interval = setInterval(() => {
            if (index < text.length) {
                const currentText = text.slice(0, index + 1)
                setStreamingText(currentText)
                setMessages((prev) =>
                    prev.map((msg, i) =>
                        i === messageIndex
                            ? { ...msg, content: currentText }
                            : msg
                    )
                )
                index++
            } else {
                clearInterval(interval)
                setIsStreaming(false)
                setStreamingText("")
                setStreamingMessageIndex(null)
                setLoading(false)
            }
        }, config.input.streamSpeed)
    }

    const streamCaption = (
        text: string,
        messageIndex: number,
        callback?: () => void
    ) => {
        setIsCaptionStreaming(true)
        setStreamingCaptionText("")
        let index = 0
        const interval = setInterval(() => {
            if (index < text.length) {
                const currentText = text.slice(0, index + 1)
                setStreamingCaptionText(currentText)
                setMessages((prev) =>
                    prev.map((msg, i) =>
                        i === messageIndex
                            ? { ...msg, imageCaption: currentText }
                            : msg
                    )
                )
                index++
            } else {
                clearInterval(interval)
                setIsCaptionStreaming(false)
                setStreamingCaptionText("")
                setMessages((prev) =>
                    prev.map((msg, i) =>
                        i === messageIndex
                            ? { ...msg, captionStreaming: false }
                            : msg
                    )
                )
                if (callback) callback()
            }
        }, config.input.streamSpeed)
    }

    const handleQuickMessage = (
        text: string,
        images: string[],
        videos: string[],
        caption: string,
        cards: Array<{ url: string; title: string; description: string; image: string }>,
        index: number,
        verticalContent: boolean
    ) => {
        if (loading) return
        isUserScrollingRef.current = false
        setUsedQuickMessages((prev) => new Set(prev).add(index))
        const userMessage: Message = {
            role: "user",
            content: text,
            timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, userMessage])
        setLoading(true)

        setTimeout(() => {
            const hasMedia =
                (images && images.length > 0) || (videos && videos.length > 0)
            if (hasMedia) {
                const assistantMessage: Message = {
                    role: "assistant",
                    content: "",
                    images: images || [],
                    videos: videos || [],
                    imageCaption:
                        caption && caption.trim() !== "" ? "" : caption,
                    timestamp: new Date().toISOString(),
                    captionStreaming: !!(caption && caption.trim() !== ""),
                    cards: cards.length > 0 ? cards : [],
                    verticalContent: verticalContent,
                }
                const messageIndex = messages.length + 1
                setMessages((prev) => [...prev, assistantMessage])
                setLoading(false)

                if (caption && caption.trim() !== "") {
                    streamCaption(caption, messageIndex)
                }
            } else {
                const assistantMessage: Message = {
                    role: "assistant",
                    content: "",
                    timestamp: new Date().toISOString(),
                    captionStreaming: false,
                    cards: cards.length > 0 ? cards : [],
                }
                const messageIndex = messages.length + 1
                setMessages((prev) => [...prev, assistantMessage])

                if (caption && caption.trim() !== "") {
                    streamText(caption, messageIndex)
                } else {
                    setLoading(false)
                }
            }
        }, 800)
    }

    const sendMessage = () => {
        if (!input.trim() || loading) return
        isUserScrollingRef.current = false
        const userMessage: Message = {
            role: "user",
            content: input,
            timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, userMessage])
        const userInput = input
        setInput("")
        setLoading(true)

        setTimeout(() => {
            const greetingWords = ["hello", "hey", "hi"]
            const containsGreeting = greetingWords.some((word) =>
                userInput.toLowerCase().includes(word)
            )
            const containsHelloThere = userInput
                .toLowerCase()
                .includes("hello there")
            const containsContact = userInput.toLowerCase().includes("contact")

            isUserScrollingRef.current = false

            if (containsHelloThere) {
                const hasHelloThereImage =
                    config.specialResponses.helloThereImage &&
                    config.specialResponses.helloThereImage.trim() !== ""

                const responseText =
                    config.specialResponses.helloThereResponseText &&
                    config.specialResponses.helloThereResponseText.trim() !== ""
                        ? config.specialResponses.helloThereResponseText
                        : "General Kenobi! You are a bold one."

                if (hasHelloThereImage) {
                    const assistantMessage: Message = {
                        role: "assistant",
                        content: "",
                        images: [config.specialResponses.helloThereImage],
                        imageCaption: "",
                        timestamp: new Date().toISOString(),
                        captionStreaming: true,
                    }
                    const messageIndex = messages.length + 1
                    setMessages((prev) => [...prev, assistantMessage])
                    setLoading(false)

                    streamCaption(responseText, messageIndex)
                } else {
                    const assistantMessage: Message = {
                        role: "assistant",
                        content: "",
                        timestamp: new Date().toISOString(),
                        captionStreaming: false,
                    }
                    const messageIndex = messages.length + 1
                    setMessages((prev) => [...prev, assistantMessage])

                    streamText(responseText, messageIndex)
                }
            } else if (
                containsGreeting &&
                config.specialResponses.greetingLottie &&
                config.specialResponses.greetingLottie.trim() !== ""
            ) {
                const assistantMessage: Message = {
                    role: "assistant",
                    content: "",
                    timestamp: new Date().toISOString(),
                    captionStreaming: false,
                }
                const messageIndex = messages.length + 1
                setMessages((prev) => [...prev, assistantMessage])

                const responseText =
                    config.specialResponses.greetingResponseText &&
                    config.specialResponses.greetingResponseText.trim() !== ""
                        ? config.specialResponses.greetingResponseText
                        : "Hello! How can I help you today?"

                setShowConfetti(true)

                streamText(responseText, messageIndex)
            } else if (containsContact) {
                const assistantMessage: Message = {
                    role: "assistant",
                    content: "",
                    timestamp: new Date().toISOString(),
                    captionStreaming: false,
                    showContactForm: true,
                }
                const messageIndex = messages.length + 1
                setMessages((prev) => [...prev, assistantMessage])

                const responseText =
                    config.specialResponses.contactResponseText &&
                    config.specialResponses.contactResponseText.trim() !== ""
                        ? config.specialResponses.contactResponseText
                        : "Happy to chat!"

                streamText(responseText, messageIndex)
            } else {
                const assistantMessage: Message = {
                    role: "assistant",
                    content: "",
                    timestamp: new Date().toISOString(),
                    captionStreaming: false,
                }
                const messageIndex = messages.length + 1
                setMessages((prev) => [...prev, assistantMessage])
                streamText(config.specialResponses.defaultText, messageIndex)
            }
        }, 800)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const openLightbox = (
        media: Array<{ url: string; type: "image" | "video" }>,
        index: number
    ) => {
        setLightboxMedia(media)
        setCurrentMediaIndex(index)
        setLightboxOpen(true)
    }

    const closeLightbox = () => {
        setLightboxOpen(false)
    }

    const goToNextMedia = () => {
        setCurrentMediaIndex((prev) => (prev + 1) % lightboxMedia.length)
    }

    const goToPrevMedia = () => {
        setCurrentMediaIndex(
            (prev) => (prev - 1 + lightboxMedia.length) % lightboxMedia.length
        )
    }

    const nextMedia = (e: React.MouseEvent) => {
        e.stopPropagation()
        goToNextMedia()
    }

    const prevMedia = (e: React.MouseEvent) => {
        e.stopPropagation()
        goToPrevMedia()
    }

    const handleGifClick = () => {
        setGifKey(Date.now())
    }

    const availableQuickMessages = quickMessages.filter(
        (_, index) => !usedQuickMessages.has(index)
    )

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                backgroundColor: config.colors.backgroundColor,
                fontFamily: config.input.font,
                position: "relative",
            }}
        >
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                style={{
                    flex: 1,
                    width: "100%",
                    overflowY: "auto",
                    overflowX: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: hasMessages ? "flex-start" : "center",
                    paddingTop: hasMessages ? "20px" : "0",
                    paddingBottom:
                        availableQuickMessages.length > 0 ? "20px" : "0",
                    scrollBehavior: "smooth",
                }}
            >
                {hasMessages && (
                    <div
                        style={{
                            width: "100%",
                            maxWidth: `${config.input.maxWidth}px`,
                            display: "flex",
                            flexDirection: "column",
                            marginTop: "auto",
                        }}
                    >
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className="message-appear"
                                style={{
                                    animation:
                                        "messageSlideIn 0.4s ease-out forwards",
                                    animationDelay: `${i * 0.1}s`,
                                    opacity: 0,
                                }}
                            >
                                {msg.role === "user" ? (
                                    <div
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            justifyContent: "flex-end",
                                            padding: "20px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "inline-block",
                                                maxWidth: "70%",
                                                padding: "12px 16px",
                                                backgroundColor:
                                                    config.colors.userMessageColor,
                                                color: config.colors.userTextColor,
                                                fontSize: `${config.input.fontSize}px`,
                                                lineHeight: "1.6",
                                                borderRadius: "8px",
                                                transition:
                                                    "transform 0.2s ease, box-shadow 0.2s ease",
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform =
                                                    "translateY(-1px)"
                                                e.currentTarget.style.boxShadow =
                                                    "0 4px 12px rgba(0,0,0,0.3)"
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform =
                                                    "translateY(0)"
                                                e.currentTarget.style.boxShadow =
                                                    "none"
                                            }}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            width: "100%",
                                            padding: "20px 0",
                                        }}
                                    >
                                        {(msg.images &&
                                            msg.images.length > 0) ||
                                            (msg.videos &&
                                                msg.videos.length > 0) ? (
                                            <div
                                                style={{
                                                    width: "100%",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "12px",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: "100%",
                                                        position: "relative",
                                                        paddingLeft: "20px",
                                                        paddingRight: "20px",
                                                    }}
                                                >
                                                    <div
                                                        ref={(el) => {
                                                            if (el)
                                                                mediaScrollRefs.current.set(
                                                                    i,
                                                                    el
                                                                )
                                                        }}
                                                        className="images-scroll-container"
                                                        style={{
                                                            width: "100%",
                                                            display: "flex",
                                                            gap: "12px",
                                                            overflowX: "auto",
                                                            overflowY:
                                                                "visible",
                                                            paddingBottom:
                                                                "8px",
                                                            scrollbarWidth:
                                                                "none",
                                                            msOverflowStyle:
                                                                "none" as React.CSSProperties["msOverflowStyle"],
                                                            scrollBehavior:
                                                                "smooth",
                                                            cursor: "grab",
                                                            WebkitOverflowScrolling:
                                                                "touch",
                                                        }}
                                                    >
                                                        {(() => {
                                                            const allMedia: Array<{
                                                                url: string
                                                                type:
                                                                | "image"
                                                                | "video"
                                                            }> = [
                                                                    ...(
                                                                        msg.images ||
                                                                        []
                                                                    ).map(
                                                                        (url) => ({
                                                                            url,
                                                                            type: "image" as const,
                                                                        })
                                                                    ),
                                                                    ...(
                                                                        msg.videos ||
                                                                        []
                                                                    ).map(
                                                                        (url) => ({
                                                                            url,
                                                                            type: "video" as const,
                                                                        })
                                                                    ),
                                                                ]
                                                            const objectFit =
                                                                "cover"
                                                            const verticalWidth =
                                                                "113px"
                                                            return allMedia.map(
                                                                (
                                                                    media,
                                                                    idx
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            idx
                                                                        }
                                                                        onClick={() =>
                                                                            openLightbox(
                                                                                allMedia,
                                                                                idx
                                                                            )
                                                                        }
                                                                        style={{
                                                                            height: "200px",
                                                                            width: msg.verticalContent
                                                                                ? verticalWidth
                                                                                : `${config.input.mediaMaxWidth}px`,
                                                                            minWidth:
                                                                                msg.verticalContent
                                                                                    ? verticalWidth
                                                                                    : `${config.input.mediaMaxWidth}px`,
                                                                            maxWidth:
                                                                                msg.verticalContent
                                                                                    ? verticalWidth
                                                                                    : `${config.input.mediaMaxWidth}px`,
                                                                            flexShrink: 0,
                                                                            cursor: "pointer",
                                                                            borderRadius:
                                                                                "12px",
                                                                            overflow:
                                                                                "hidden",
                                                                            boxShadow:
                                                                                "0 4px 16px rgba(0,0,0,0.4)",
                                                                            border: "1px solid rgba(255,255,255,0.1)",
                                                                            transition:
                                                                                "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease",
                                                                            animation: `imageFadeIn 0.6s ease-out forwards ${idx * 0.15}s`,
                                                                            opacity: 0,
                                                                            position:
                                                                                "relative",
                                                                            display:
                                                                                "flex",
                                                                            alignItems:
                                                                                "center",
                                                                            justifyContent:
                                                                                "center",
                                                                            backgroundColor:
                                                                                "#000",
                                                                        }}
                                                                        onMouseEnter={(
                                                                            e
                                                                        ) => {
                                                                            e.currentTarget.style.transform =
                                                                                "scale(1.05)"
                                                                            e.currentTarget.style.boxShadow =
                                                                                "0 8px 24px rgba(0,0,0,0.6)"
                                                                        }}
                                                                        onMouseLeave={(
                                                                            e
                                                                        ) => {
                                                                            e.currentTarget.style.transform =
                                                                                "scale(1)"
                                                                            e.currentTarget.style.boxShadow =
                                                                                "0 4px 16px rgba(0,0,0,0.4)"
                                                                        }}
                                                                    >
                                                                        {media.type ===
                                                                            "image" ? (
                                                                            <img
                                                                                src={
                                                                                    media.url
                                                                                }
                                                                                alt={`Response ${idx + 1}`}
                                                                                style={{
                                                                                    width: "100%",
                                                                                    height: "100%",
                                                                                    objectFit:
                                                                                        objectFit,
                                                                                    display:
                                                                                        "block",
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            <video
                                                                                ref={(
                                                                                    el
                                                                                ) => {
                                                                                    if (
                                                                                        el
                                                                                    )
                                                                                        videoRefs.current.set(
                                                                                            idx,
                                                                                            el
                                                                                        )
                                                                                }}
                                                                                src={
                                                                                    media.url
                                                                                }
                                                                                style={{
                                                                                    width: "100%",
                                                                                    height: "100%",
                                                                                    objectFit:
                                                                                        objectFit,
                                                                                    display:
                                                                                        "block",
                                                                                }}
                                                                                autoPlay
                                                                                loop
                                                                                muted
                                                                                playsInline
                                                                            />
                                                                        )}
                                                                    </div>
                                                                )
                                                            )
                                                        })()}
                                                    </div>
                                                    <div
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            left: 0,
                                                            top: 0,
                                                            bottom: "8px",
                                                            width: "40px",
                                                            background: `linear-gradient(to right, ${config.colors.backgroundColor}, transparent)`,
                                                            pointerEvents:
                                                                "none",
                                                            zIndex: 1,
                                                        }}
                                                    />
                                                    <div
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            right: 0,
                                                            top: 0,
                                                            bottom: "8px",
                                                            width: "40px",
                                                            background: `linear-gradient(to left, ${config.colors.backgroundColor}, transparent)`,
                                                            pointerEvents:
                                                                "none",
                                                            zIndex: 1,
                                                        }}
                                                    />
                                                </div>
                                                {msg.imageCaption &&
                                                    msg.imageCaption.trim() !==
                                                    "" && (
                                                        <div
                                                            style={{
                                                                width: "100%",
                                                                paddingLeft:
                                                                    "20px",
                                                                paddingRight:
                                                                    "20px",
                                                                animation:
                                                                    "fadeIn 0.3s ease-out",
                                                                opacity: 1,
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    color: config.colors.aiTextColor,
                                                                    fontSize: `${config.input.fontSize}px`,
                                                                    lineHeight:
                                                                        "1.6",
                                                                }}
                                                            >
                                                                {
                                                                    msg.imageCaption
                                                                }
                                                                {msg.captionStreaming && (
                                                                    <span
                                                                        style={{
                                                                            display:
                                                                                "inline-block",
                                                                            width: "2px",
                                                                            height: `${config.input.fontSize}px`,
                                                                            backgroundColor:
                                                                                config.colors.aiTextColor,
                                                                            marginLeft:
                                                                                "2px",
                                                                            animation:
                                                                                "blink 1s infinite",
                                                                        }}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                            </div>
                                        ) : msg.content &&
                                            msg.content.trim() !== "" ? (
                                            <div
                                                style={{
                                                    width: "100%",
                                                    paddingLeft: "20px",
                                                    paddingRight: "20px",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        color: config.colors.aiTextColor,
                                                        fontSize: `${config.input.fontSize}px`,
                                                        lineHeight: "1.6",
                                                    }}
                                                >
                                                    {msg.content}
                                                    {streamingMessageIndex ===
                                                        i && (
                                                            <span
                                                                style={{
                                                                    display:
                                                                        "inline-block",
                                                                    width: "2px",
                                                                    height: `${config.input.fontSize}px`,
                                                                    backgroundColor:
                                                                        config.colors.aiTextColor,
                                                                    marginLeft:
                                                                        "2px",
                                                                    animation:
                                                                        "blink 1s infinite",
                                                                }}
                                                            />
                                                        )}
                                                </div>
                                            </div>
                                        ) : null}

                                        {msg.cards && msg.cards.length > 0 && (
                                            <div
                                                style={{
                                                    width: "100%",
                                                    paddingLeft: "20px",
                                                    paddingRight: "20px",
                                                    marginTop: "12px",
                                                    display: "flex",
                                                    gap: "12px",
                                                    overflowX: "auto",
                                                    scrollbarWidth: "none",
                                                    msOverflowStyle: "none" as React.CSSProperties["msOverflowStyle"],
                                                }}
                                            >
                                                {msg.cards.map(
                                                    (card, cardIdx) => (
                                                        <a
                                                            key={cardIdx}
                                                            href={card.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                display:
                                                                    "block",
                                                                minWidth:
                                                                    "280px",
                                                                maxWidth:
                                                                    "280px",
                                                                backgroundColor:
                                                                    config.colors.userMessageColor,
                                                                borderRadius:
                                                                    "12px",
                                                                overflow:
                                                                    "hidden",
                                                                border: "1px solid rgba(255,255,255,0.1)",
                                                                textDecoration:
                                                                    "none",
                                                                cursor: "pointer",
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            {card.image &&
                                                                card.image.trim() !==
                                                                "" && (
                                                                    <div
                                                                        style={{
                                                                            width: "100%",
                                                                            height: "140px",
                                                                            overflow:
                                                                                "hidden",
                                                                        }}
                                                                    >
                                                                        <img
                                                                            src={
                                                                                card.image
                                                                            }
                                                                            alt={
                                                                                card.title
                                                                            }
                                                                            style={{
                                                                                width: "100%",
                                                                                height: "100%",
                                                                                objectFit:
                                                                                    "cover",
                                                                            }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            <div
                                                                style={{
                                                                    padding:
                                                                        "14px",
                                                                }}
                                                            >
                                                                {card.title &&
                                                                    card.title.trim() !==
                                                                    "" && (
                                                                        <div
                                                                            style={{
                                                                                color: config.colors.userTextColor,
                                                                                fontSize: `${config.input.fontSize + 1}px`,
                                                                                fontWeight: 600,
                                                                                marginBottom:
                                                                                    "6px",
                                                                                lineHeight:
                                                                                    "1.3",
                                                                                overflow:
                                                                                    "hidden",
                                                                                textOverflow:
                                                                                    "ellipsis",
                                                                                display:
                                                                                    "-webkit-box",
                                                                                WebkitLineClamp: 2,
                                                                                WebkitBoxOrient:
                                                                                    "vertical",
                                                                            }}
                                                                        >
                                                                            {
                                                                                card.title
                                                                            }
                                                                        </div>
                                                                    )}
                                                                {card.description &&
                                                                    card.description.trim() !==
                                                                    "" && (
                                                                        <div
                                                                            style={{
                                                                                color: config.colors.aiTextColor,
                                                                                fontSize: `${config.input.fontSize - 2}px`,
                                                                                lineHeight:
                                                                                    "1.4",
                                                                                opacity: 0.7,
                                                                                overflow:
                                                                                    "hidden",
                                                                                textOverflow:
                                                                                    "ellipsis",
                                                                                display:
                                                                                    "-webkit-box",
                                                                                WebkitLineClamp: 2,
                                                                                WebkitBoxOrient:
                                                                                    "vertical",
                                                                            }}
                                                                        >
                                                                            {
                                                                                card.description
                                                                            }
                                                                        </div>
                                                                    )}
                                                                <div
                                                                    style={{
                                                                        marginTop:
                                                                            "10px",
                                                                        color: config.colors.buttonColor,
                                                                        fontSize: `${config.input.fontSize - 3}px`,
                                                                        fontWeight: 500,
                                                                        display:
                                                                            "flex",
                                                                        alignItems:
                                                                            "center",
                                                                        gap: "4px",
                                                                    }}
                                                                >
                                                                    {
                                                                        new URL(
                                                                            card.url
                                                                        )
                                                                            .hostname
                                                                    }
                                                                    <svg
                                                                        width="10"
                                                                        height="10"
                                                                        viewBox="0 0 24 24"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth="2.5"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                    >
                                                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                                        <polyline points="15 3 21 3 21 9"></polyline>
                                                                        <line
                                                                            x1="10"
                                                                            y1="14"
                                                                            x2="21"
                                                                            y2="3"
                                                                        ></line>
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        </a>
                                                    )
                                                )}
                                            </div>
                                        )}

                                        {msg.showContactForm &&
                                            config.specialResponses.contactEmail && (
                                                <div
                                                    style={{
                                                        width: "100%",
                                                        paddingLeft: "20px",
                                                        paddingRight: "20px",
                                                        marginTop: "12px",
                                                    }}
                                                >
                                                    <a
                                                        href={`mailto:${config.specialResponses.contactEmail}`}
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "8px",
                                                            padding: "12px 20px",
                                                            backgroundColor: config.colors.buttonColor,
                                                            color: "#fff",
                                                            fontSize: `${config.input.fontSize}px`,
                                                            fontFamily: config.input.font,
                                                            fontWeight: 500,
                                                            borderRadius: "12px",
                                                            textDecoration: "none",
                                                            transition: "all 0.25s ease",
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.transform = "translateY(-2px)"
                                                            e.currentTarget.style.boxShadow = `0 6px 20px ${config.colors.buttonColor}50`
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.transform = "translateY(0)"
                                                            e.currentTarget.style.boxShadow = "none"
                                                        }}
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="2" y="4" width="20" height="16" rx="2"/>
                                                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                                                        </svg>
                                                        {config.specialResponses.contactEmail}
                                                    </a>
                                                </div>
                                            )}
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && !isStreaming && (
                            <div
                                style={{
                                    width: "100%",
                                    padding: "20px",
                                    animation: "fadeIn 0.3s ease-out",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "6px",
                                        alignItems: "center",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "8px",
                                            height: "8px",
                                            borderRadius: "50%",
                                            backgroundColor: config.colors.aiTextColor,
                                            opacity: 0.5,
                                            animation:
                                                "bounce 1.4s infinite ease-in-out both",
                                        }}
                                    />
                                    <div
                                        style={{
                                            width: "8px",
                                            height: "8px",
                                            borderRadius: "50%",
                                            backgroundColor: config.colors.aiTextColor,
                                            opacity: 0.5,
                                            animation:
                                                "bounce 1.4s infinite ease-in-out both 0.2s",
                                        }}
                                    />
                                    <div
                                        style={{
                                            width: "8px",
                                            height: "8px",
                                            borderRadius: "50%",
                                            backgroundColor: config.colors.aiTextColor,
                                            opacity: 0.5,
                                            animation:
                                                "bounce 1.4s infinite ease-in-out both 0.4s",
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flexShrink: 0,
                    backgroundColor: "transparent",
                    transform: hasAnimated
                        ? "translateY(0)"
                        : "translateY(calc(-50vh + 50%))",
                    transition: hasAnimated
                        ? "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
                        : "none",
                }}
            >
                {!hasMessages && (
                    <>
                        {config.header.gif && config.header.gif.trim() !== "" && (
                            <div
                                style={{
                                    width: "100%",
                                    maxWidth: `${config.input.maxWidth}px`,
                                    padding: "0 20px 16px 20px",
                                    display: "flex",
                                    justifyContent: "center",
                                    animation: hasAnimated
                                        ? "fadeOut 0.4s ease-out forwards"
                                        : "fadeIn 0.5s ease-out",
                                    opacity: hasAnimated ? 0 : 1,
                                    position: "relative",
                                    zIndex: 5,
                                }}
                            >
                                <div
                                    style={{
                                        position: "relative",
                                        borderRadius: "8px",
                                        overflow: "visible",
                                        maxWidth: "100%",
                                        cursor: "pointer",
                                        height: `${config.header.gifSize}px`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                    onClick={handleGifClick}
                                >
                                    <img
                                        key={gifKey}
                                        src={`${config.header.gif}?t=${gifKey}`}
                                        alt="Header animation"
                                        style={{
                                            maxWidth: "100%",
                                            height: "auto",
                                            maxHeight: `${config.header.gifSize}px`,
                                            display: "block",
                                            borderRadius: "8px",
                                            objectFit: "contain",
                                        }}
                                    />
                                    {config.header.gifGradient && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: "-1px",
                                                right: "-1px",
                                                bottom: "-5px",
                                                height: `calc(${config.header.gifGradientHeight}% + 5px)`,
                                                background: `linear-gradient(to top, ${config.header.gifGradientColor}, transparent)`,
                                                pointerEvents: "none",
                                                borderRadius: "0 0 8px 8px",
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                        {config.header.title &&
                            config.header.title.trim() !== "" && (
                                <div
                                    style={{
                                        width: "100%",
                                        maxWidth: `${config.input.maxWidth}px`,
                                        padding: "0 20px 24px 20px",
                                        textAlign: "center",
                                        animation: hasAnimated
                                            ? "fadeOut 0.4s ease-out forwards"
                                            : "fadeIn 0.5s ease-out",
                                        opacity: hasAnimated ? 0 : 1,
                                        position: "relative",
                                        zIndex: 5,
                                    }}
                                >
                                    <h1
                                        style={{
                                            margin: 0,
                                            fontSize: `${config.header.fontSize}px`,
                                            fontFamily: config.header.font,
                                            color: config.colors.inputTextColor,
                                            fontWeight: 600,
                                            lineHeight: 1.2,
                                        }}
                                    >
                                        {config.header.title}
                                    </h1>
                                </div>
                            )}
                    </>
                )}
                {availableQuickMessages.length > 0 && (
                    <div
                        style={{
                            width: "100%",
                            maxWidth: `${config.input.maxWidth}px`,
                            padding: "0 20px 8px 20px",
                            position: "relative",
                            backgroundColor: "transparent",
                            zIndex: 1,
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                bottom: "-25px",
                                top: "-80px",
                                height: "80px",
                                background: `linear-gradient(to bottom, transparent 0%, transparent 25%, ${config.colors.backgroundColor} 100%)`,
                                pointerEvents: "none",
                                zIndex: 0,
                            }}
                        />

                        <div
                            ref={quickMessagesScrollRef}
                            className="quick-messages-scroll"
                            style={{
                                width: "100%",
                                display: "flex",
                                gap: "8px",
                                overflowX: "auto",
                                scrollbarWidth: "none",
                                msOverflowStyle: "none" as React.CSSProperties["msOverflowStyle"],
                                paddingBottom: "4px",
                                cursor: "grab",
                                position: "relative",
                                zIndex: 2,
                            }}
                        >
                            {availableQuickMessages.map((msg, i) => {
                                const originalIndex = quickMessages.findIndex(
                                    (qm) => qm.text === msg.text
                                )
                                return (
                                    <button
                                        key={originalIndex}
                                        onClick={() =>
                                            handleQuickMessage(
                                                msg.text,
                                                msg.images,
                                                msg.videos,
                                                msg.caption,
                                                msg.cards,
                                                originalIndex,
                                                msg.verticalContent
                                            )
                                        }
                                        disabled={loading || isStreaming}
                                        className="quick-message-button"
                                        style={{
                                            padding: "10px 18px",
                                            backgroundColor:
                                                config.colors.quickMessageColor,
                                            color: config.colors.quickMessageTextColor,
                                            border: "1px solid rgba(255,255,255,0.15)",
                                            borderRadius: "20px",
                                            fontSize: `${config.input.fontSize - 1}px`,
                                            fontFamily: config.input.font,
                                            cursor:
                                                loading || isStreaming
                                                    ? "not-allowed"
                                                    : "pointer",
                                            transition:
                                                "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                                            boxShadow:
                                                "0 2px 8px rgba(0,0,0,0.3)",
                                            animation: `buttonSlideIn 0.4s ease-out forwards ${i * 0.08}s`,
                                            opacity: 0,
                                            transform: "translateY(10px)",
                                            flexShrink: 0,
                                            whiteSpace: "nowrap",
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!loading && !isStreaming) {
                                                e.currentTarget.style.backgroundColor =
                                                    config.colors.quickMessageHoverColor
                                                e.currentTarget.style.transform =
                                                    "translateY(-2px)"
                                                e.currentTarget.style.boxShadow =
                                                    "0 6px 16px rgba(0,0,0,0.4)"
                                                e.currentTarget.style.borderColor =
                                                    "rgba(255,255,255,0.25)"
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor =
                                                config.colors.quickMessageColor
                                            e.currentTarget.style.transform =
                                                "translateY(0)"
                                            e.currentTarget.style.boxShadow =
                                                "0 2px 8px rgba(0,0,0,0.3)"
                                            e.currentTarget.style.borderColor =
                                                "rgba(255,255,255,0.15)"
                                        }}
                                        onMouseDown={(e) => {
                                            if (!loading && !isStreaming) {
                                                e.currentTarget.style.transform =
                                                    "translateY(0) scale(0.98)"
                                            }
                                        }}
                                        onMouseUp={(e) => {
                                            if (!loading && !isStreaming) {
                                                e.currentTarget.style.transform =
                                                    "translateY(-2px) scale(1)"
                                            }
                                        }}
                                    >
                                        {msg.text}
                                    </button>
                                )
                            })}
                        </div>

                        <div
                            style={{
                                position: "absolute",
                                left: "20px",
                                top: 0,
                                bottom: "12px",
                                width: "20px",
                                background: `linear-gradient(to right, ${config.colors.backgroundColor}, transparent)`,
                                pointerEvents: "none",
                                zIndex: 3,
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                right: "20px",
                                top: 0,
                                bottom: "12px",
                                width: "20px",
                                background: `linear-gradient(to left, ${config.colors.backgroundColor}, transparent)`,
                                pointerEvents: "none",
                                zIndex: 3,
                            }}
                        />
                    </div>
                )}
                <div
                    style={{
                        width: "100%",
                        maxWidth: `${config.input.maxWidth}px`,
                        padding: "20px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            gap: "12px",
                            alignItems: "center",
                            padding: "12px",
                            backgroundColor: config.colors.inputBackgroundColor,
                            borderRadius: `${config.input.borderRadius}px`,
                            border: `1px solid ${config.colors.inputBorderColor}`,
                            transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor =
                                config.colors.buttonColor
                            e.currentTarget.style.boxShadow = `0 0 0 3px ${config.colors.buttonColor}30`
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor =
                                config.colors.inputBorderColor
                            e.currentTarget.style.boxShadow = "none"
                        }}
                    >
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={config.input.placeholder}
                            disabled={loading || isStreaming}
                            rows={1}
                            style={{
                                flex: 1,
                                border: "none",
                                backgroundColor: "transparent",
                                fontSize: `${config.input.fontSize}px`,
                                outline: "none",
                                fontFamily: config.input.font,
                                resize: "none",
                                paddingLeft: "8px",
                                maxHeight: "200px",
                                overflow: "auto",
                                color: config.colors.inputTextColor,
                                lineHeight: "1.5",
                                transition: "opacity 0.2s ease",
                            }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={loading || isStreaming || !input.trim()}
                            style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                backgroundColor:
                                    loading || isStreaming || !input.trim()
                                        ? config.colors.buttonDisabledColor
                                        : config.colors.buttonColor,
                                border: "none",
                                cursor:
                                    loading || isStreaming || !input.trim()
                                        ? "not-allowed"
                                        : "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                transition:
                                    "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                transform: "scale(1)",
                                transformOrigin: "center",
                                willChange: "transform",
                            }}
                            onMouseEnter={(e) => {
                                if (!loading && !isStreaming && input.trim()) {
                                    e.currentTarget.style.transform =
                                        "scale(1.1)"
                                    e.currentTarget.style.boxShadow = `0 6px 16px ${config.colors.buttonColor}60`
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform =
                                    "scale(1)"
                                e.currentTarget.style.boxShadow = "none"
                            }}
                            onMouseDown={(e) => {
                                if (!loading && !isStreaming && input.trim()) {
                                    e.currentTarget.style.transform =
                                        "scale(0.95)"
                                }
                            }}
                            onMouseUp={(e) => {
                                if (!loading && !isStreaming && input.trim()) {
                                    e.currentTarget.style.transform =
                                        "scale(1.1)"
                                }
                            }}
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                    transform: "rotate(0deg)",
                                    transformOrigin: "center",
                                }}
                            >
                                <line x1="12" y1="19" x2="12" y2="5" />
                                <polyline points="5 12 12 5 19 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {showConfetti && config.specialResponses.greetingLottie && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        pointerEvents: "none",
                        zIndex: 999,
                        animation: "fadeIn 0.3s ease-out",
                    }}
                >
                    <div
                        ref={lottieContainerRef}
                        style={{
                            width: "100%",
                            height: "100%",
                        }}
                    />
                </div>
            )}

            {lightboxOpen && (
                <div
                    onClick={closeLightbox}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.95)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        cursor: "pointer",
                        animation: "fadeIn 0.2s ease-out",
                    }}
                >
                    {lightboxMedia.length > 1 && (
                        <button
                            onClick={prevMedia}
                            style={{
                                position: "absolute",
                                left: "20px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: "50px",
                                height: "50px",
                                borderRadius: "50%",
                                backgroundColor: "rgba(255, 255, 255, 0.15)",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition:
                                    "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                zIndex: 1001,
                                backdropFilter: "blur(10px)",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    "rgba(255, 255, 255, 0.25)"
                                e.currentTarget.style.transform =
                                    "translateY(-50%) scale(1.1)"
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    "rgba(255, 255, 255, 0.15)"
                                e.currentTarget.style.transform =
                                    "translateY(-50%) scale(1)"
                            }}
                        >
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                    )}
                    {lightboxMedia[currentMediaIndex]?.type === "image" ? (
                        <img
                            key={currentMediaIndex}
                            src={lightboxMedia[currentMediaIndex].url}
                            alt="Full view"
                            style={{
                                maxWidth: "90%",
                                maxHeight: "90%",
                                objectFit: "contain",
                                borderRadius: "12px",
                                animation: "imageFadeIn 0.3s ease-out",
                                boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
                            }}
                        />
                    ) : (
                        <video
                            key={currentMediaIndex}
                            src={lightboxMedia[currentMediaIndex]?.url}
                            controls
                            autoPlay
                            style={{
                                maxWidth: "90%",
                                maxHeight: "90%",
                                borderRadius: "12px",
                                animation: "imageFadeIn 0.3s ease-out",
                                boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
                            }}
                        />
                    )}
                    {lightboxMedia.length > 1 && (
                        <>
                            <button
                                onClick={nextMedia}
                                style={{
                                    position: "absolute",
                                    right: "20px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    width: "50px",
                                    height: "50px",
                                    borderRadius: "50%",
                                    backgroundColor:
                                        "rgba(255, 255, 255, 0.15)",
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition:
                                        "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    zIndex: 1001,
                                    backdropFilter: "blur(10px)",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        "rgba(255, 255, 255, 0.25)"
                                    e.currentTarget.style.transform =
                                        "translateY(-50%) scale(1.1)"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        "rgba(255, 255, 255, 0.15)"
                                    e.currentTarget.style.transform =
                                        "translateY(-50%) scale(1)"
                                }}
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: "30px",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    color: "white",
                                    fontSize: "14px",
                                    fontFamily: config.input.font,
                                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                                    padding: "8px 16px",
                                    borderRadius: "20px",
                                    backdropFilter: "blur(10px)",
                                    animation:
                                        "fadeIn 0.3s ease-out 0.1s backwards",
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                }}
                            >
                                {currentMediaIndex + 1} / {lightboxMedia.length}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
