export interface Message {
    role: "user" | "assistant"
    content: string
    images?: string[]
    videos?: string[]
    imageCaption?: string
    timestamp: string
    captionStreaming?: boolean
    cards?: Array<{
        url: string
        title: string
        description: string
        image: string
    }>
    showContactForm?: boolean
    verticalContent?: boolean
}

export interface QuickMessageConfig {
    id: string
    text: string
    verticalContent: boolean
    images: string[]
    videos: string[]
    caption: string
    cards: Array<{
        url: string
        title: string
        description: string
        image: string
    }>
}

export interface ChatConfig {
    header: {
        title: string
        font: string
        fontSize: number
        gif: string
        gifSize: number
        gifGradient: boolean
        gifGradientColor: string
        gifGradientHeight: number
    }
    input: {
        placeholder: string
        font: string
        fontSize: number
        maxWidth: number
        borderRadius: number
        streamSpeed: number
        mediaMaxWidth: number
        mediaGalleryAutoScroll: boolean
        mediaGalleryScrollSpeed: number
    }
    colors: {
        backgroundColor: string
        userMessageColor: string
        userTextColor: string
        aiBackgroundColor: string
        aiTextColor: string
        inputBackgroundColor: string
        inputBorderColor: string
        inputTextColor: string
        buttonColor: string
        buttonDisabledColor: string
        quickMessageColor: string
        quickMessageTextColor: string
        quickMessageHoverColor: string
    }
    specialResponses: {
        defaultText: string
        contactFormUrl: string
        contactFormHeight: number
        contactResponseText: string
        contactEmail: string
        greetingLottie: string
        greetingResponseText: string
        helloThereResponseText: string
        helloThereImage: string
    }
    quickMessages: QuickMessageConfig[]
}
