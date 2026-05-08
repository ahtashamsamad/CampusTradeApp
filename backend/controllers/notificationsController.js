// Mock database for notifications
let notifications = [
    {
        id: '1', type: 'message', title: 'New message from Sara',
        body: 'Hey! Is the calculus textbook still available?', time: '2m ago', read: false,
    },
    {
        id: '2', type: 'sale', title: 'Item Sold 🎉',
        body: 'Your "Physics Lab Kit" has been sold to Alex!', time: '18m ago', read: false,
    },
    {
        id: '3', type: 'price', title: 'Price Drop Alert',
        body: '"MacBook Pro 2023" in your saved items dropped by Rs 120.', time: '1h ago', read: false,
    },
    {
        id: '4', type: 'review', title: 'New Review Received',
        body: 'Jordan left you a 5-star review: "Great seller, fast response!"', time: '3h ago', read: true,
    },
    {
        id: '5', type: 'system', title: 'Verify your student email',
        body: 'Verified sellers get a trust badge and more views.', time: 'Yesterday', read: true,
    },
    {
        id: '6', type: 'message', title: 'New message from Mike',
        body: 'Can we meet at the student union tomorrow at noon?', time: 'Yesterday', read: true,
    },
    {
        id: '7', type: 'price', title: 'Price Drop Alert',
        body: '"Organic Chemistry Textbook" dropped to Rs 25!', time: '2 days ago', read: true,
    },
];

// Get all notifications
exports.getNotifications = async (req, res) => {
    try {
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const index = notifications.findIndex(n => n.id === id);
        if (index > -1) {
            notifications[index].read = true;
        }
        res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notification', error });
    }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
    try {
        notifications = notifications.map(n => ({ ...n, read: true }));
        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notifications', error });
    }
};

// Dismiss notification
exports.dismissNotification = async (req, res) => {
    try {
        const { id } = req.params;
        notifications = notifications.filter(n => n.id !== id);
        res.status(200).json({ message: 'Notification dismissed' });
    } catch (error) {
        res.status(500).json({ message: 'Error dismissing notification', error });
    }
};

// Clear all notifications
exports.clearAllNotifications = async (req, res) => {
    try {
        notifications = [];
        res.status(200).json({ message: 'All notifications cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing notifications', error });
    }
};
