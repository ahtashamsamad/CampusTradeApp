// Mock database for chats
let chats = [
    {
        id: '1',
        participants: [
            { id: 'dev-user-123', name: 'Dev User' },
            { id: 'user-2', name: 'Sarah Williams' }
        ],
        lastMessage: 'Is the textbook still available?',
        updatedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        unreadCount: 1,
        listingId: 'Chemistry 101 Textbook'
    }
];

let messages = [
    {
        id: 'msg-1',
        chatId: '1',
        senderId: 'user-2',
        text: 'Hey! Is this item still available?',
        createdAt: new Date(Date.now() - 25 * 60000).toISOString()
    },
    {
        id: 'msg-2',
        chatId: '1',
        senderId: 'dev-user-123',
        text: 'Yes, it is! Pickup available anytime this week.',
        createdAt: new Date(Date.now() - 20 * 60000).toISOString()
    }
];

// Get user's chats
exports.getUserChats = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.uid;
        // In mock mode, we just return all chats that include this user
        const userChats = chats.filter(c =>
            c.participants.some(p => p.id === userId)
        );

        res.status(200).json(userChats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching chats', error });
    }
};

// Get messages for a specific chat
exports.getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const chatMessages = messages.filter(m => m.chatId === chatId);

        res.status(200).json(chatMessages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error });
    }
};

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const chatId = req.params.chatId || req.body.conversationId;
        const { text, senderId } = req.body;

        if (!chatId || !text) {
            return res.status(400).json({ message: 'Missing conversationId or text' });
        }

        const newMessage = {
            id: Date.now().toString(),
            chatId,
            senderId: senderId || req.user.uid,
            text,
            createdAt: new Date().toISOString()
        };

        messages.push(newMessage);

        // Update last message in chat
        const chatIndex = chats.findIndex(c => c.id === chatId);
        if (chatIndex > -1) {
            chats[chatIndex].lastMessage = text;
            chats[chatIndex].updatedAt = newMessage.createdAt;
            chats[chatIndex].lastActivity = newMessage.createdAt;
            chats[chatIndex].unreadCount = 0; // Reset unread when we send (or view)
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error in sendMessage:', error);
        res.status(500).json({ message: 'Error sending message', error: error.message });
    }
};
