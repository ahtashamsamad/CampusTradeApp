// Mock database for development until Firestore is properly connected
let listings = [
    // ──────────── BOOKS ────────────
    {
        id: '1',
        title: 'Chemistry 101 Textbook',
        price: 45.00,
        description: 'Selling my Chemistry 101 textbook. No highlights or tears. 8th edition, perfect for CHEM 101 and 102.',
        category: 'books',
        condition: 'Good',
        sellerId: 'user-1',
        images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600'],
        createdAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString()
    },
    {
        id: '2',
        title: 'Calculus: Early Transcendentals',
        price: 55.00,
        description: 'Stewart Calculus 8th edition. Slight pencil marks on first chapter, otherwise immaculate. Includes student solutions manual.',
        category: 'books',
        condition: 'Like New',
        sellerId: 'user-2',
        images: ['https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600'],
        createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString()
    },
    {
        id: '3',
        title: 'Organic Chemistry - Klein',
        price: 38.00,
        description: '3rd edition Klein Organic Chemistry. A few highlighted sections but all readable. Saved me in orgo!',
        category: 'books',
        condition: 'Fair',
        sellerId: 'user-3',
        images: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600'],
        createdAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString()
    },
    {
        id: '4',
        title: 'Introduction to Algorithms (CLRS)',
        price: 70.00,
        description: 'The classic algorithms textbook. 3rd edition, hardcover, near perfect condition. Used for CS 401.',
        category: 'books',
        condition: 'Like New',
        sellerId: 'user-4',
        images: ['https://images.unsplash.com/photo-1550399105-c4db5952c546?w=600'],
        createdAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString()
    },

    // ──────────── TECH ────────────
    {
        id: '5',
        title: 'MacBook Pro 2021 – M1 Pro',
        price: 1150.00,
        description: 'Apple MacBook Pro 14" M1 Pro, 16GB RAM, 512GB SSD. Space Grey. Perfect working order. Battery cycle count ~200. Includes original charger.',
        category: 'tech',
        condition: 'Good',
        sellerId: 'user-5',
        images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'],
        createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString()
    },
    {
        id: '6',
        title: 'TI-84 Plus Graphing Calculator',
        price: 65.00,
        description: 'Texas Instruments TI-84 Plus. All buttons fully functional, screen is crystal clear. Batteries included.',
        category: 'tech',
        condition: 'Good',
        sellerId: 'user-6',
        images: ['https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600'],
        createdAt: new Date(Date.now() - 4 * 24 * 3600000).toISOString()
    },
    {
        id: '7',
        title: 'Sony WH-1000XM4 Headphones',
        price: 180.00,
        description: 'Sony noise-cancelling headphones. Excellent sound quality, works perfectly. Comes with original case and cables. Barely used.',
        category: 'tech',
        condition: 'Like New',
        sellerId: 'user-7',
        images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600'],
        createdAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString()
    },
    {
        id: '8',
        title: 'iPad Air (2022) – 5th Gen',
        price: 420.00,
        description: 'iPad Air 5th gen, 64GB, WiFi, Blue. Used throughout the semester for note-taking. Minor scratches on back. Apple Pencil support.',
        category: 'tech',
        condition: 'Good',
        sellerId: 'user-8',
        images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600'],
        createdAt: new Date(Date.now() - 6 * 24 * 3600000).toISOString()
    },

    // ──────────── LAB GEAR ────────────
    {
        id: '9',
        title: 'Complete Chemistry Lab Kit',
        price: 35.00,
        description: 'Full set for General Chemistry labs: safety goggles, gloves, lab coat (M), beakers, test tubes, thermometer, spatulas. All cleaned and ready.',
        category: 'lab',
        condition: 'Good',
        sellerId: 'user-9',
        images: ['https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=600'],
        createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString()
    },
    {
        id: '10',
        title: 'Digital Precision Lab Scale (500g)',
        price: 22.00,
        description: 'Accurate to 0.01g. Used for weighing lab reagents. Works perfectly, just upgrading to a larger capacity model.',
        category: 'lab',
        condition: 'Good',
        sellerId: 'user-10',
        images: ['https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600'],
        createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString()
    },
    {
        id: '11',
        title: 'Dissection Lab Kit',
        price: 18.00,
        description: 'Biology dissection tools: scalpel, forceps, probe, scissors, pins, lab tray. Great condition, all sterilized.',
        category: 'lab',
        condition: 'Like New',
        sellerId: 'user-11',
        images: ['https://images.unsplash.com/photo-1576086213369-97a306d36557?w=600'],
        createdAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString()
    },

    // ──────────── FURNITURE ────────────
    {
        id: '12',
        title: 'Ergonomic Desk Chair – Black',
        price: 85.00,
        description: 'Comfortable desk chair with lumbar support, adjustable height, and breathable mesh back. Perfect for long study sessions. Disassembles for easy transport.',
        category: 'furniture',
        condition: 'Good',
        sellerId: 'user-12',
        images: ['https://images.unsplash.com/photo-1589384267710-7a170981ca78?w=600'],
        createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString()
    },
    {
        id: '13',
        title: 'Mini Compact Fridge (1.7 cu ft)',
        price: 60.00,
        description: 'Perfect dorm fridge! Runs quietly, keeps things ice cold. Has a small freezer section for ice cream. Minor scuff on side.',
        category: 'furniture',
        condition: 'Good',
        sellerId: 'user-13',
        images: ['https://images.unsplash.com/photo-1575377427642-087cf684b43d?w=600'],
        createdAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString()
    },
    {
        id: '14',
        title: 'Wooden Bookshelf (5-tier)',
        price: 40.00,
        description: '5-shelf wooden bookcase in espresso finish. Holds plenty of textbooks and décor. Needs slight tightening on one bracket but perfectly stable.',
        category: 'furniture',
        condition: 'Fair',
        sellerId: 'user-14',
        images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600'],
        createdAt: new Date(Date.now() - 4 * 24 * 3600000).toISOString()
    },

    // ──────────── CLOTHING ────────────
    {
        id: '15',
        title: 'Campus Hoodie – Navy Blue (L)',
        price: 25.00,
        description: 'Official University hoodie, size Large. Super soft fleece inside, barely worn. Great for late-night study sessions.',
        category: 'clothing',
        condition: 'Like New',
        sellerId: 'user-15',
        images: ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600'],
        createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString()
    },
    {
        id: '16',
        title: 'Nike Running Shoes (US 10)',
        price: 55.00,
        description: 'Nike Air Zoom Pegasus 38, size US 10. Used for one semester of jogging. Soles still have good grip, no major wear.',
        category: 'clothing',
        condition: 'Good',
        sellerId: 'user-16',
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],
        createdAt: new Date(Date.now() - 6 * 24 * 3600000).toISOString()
    },

    // ──────────── SPORTS ────────────
    {
        id: '17',
        title: 'Trek Mountain Bike (21-speed)',
        price: 220.00,
        description: 'Trek 820 mountain bike in great condition. 21-speed Shimano gears, recently serviced. Perfect for getting around campus. Helmet not included.',
        category: 'sports',
        condition: 'Good',
        sellerId: 'user-17',
        images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'],
        createdAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString()
    },
    {
        id: '18',
        title: 'Yoga Mat + Foam Roller Bundle',
        price: 20.00,
        description: 'Non-slip yoga mat (6mm, purple) plus a foam roller for recovery. Lightly used, cleaned after each use.',
        category: 'sports',
        condition: 'Like New',
        sellerId: 'user-18',
        images: ['https://images.unsplash.com/photo-1601925228604-8a1f8fd60a45?w=600'],
        createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString()
    },

    // ──────────── NOTES ────────────
    {
        id: '19',
        title: 'PSYCH 201 – Complete Notes Bundle',
        price: 12.00,
        description: 'Handwritten + typed lecture notes for all 14 weeks of PSYCH 201 (Intro to Psychology). Includes chapter summaries and exam prep sheets. Prof. Anderson section.',
        category: 'notes',
        condition: 'New',
        sellerId: 'user-19',
        images: ['https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600'],
        createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString()
    },
    {
        id: '20',
        title: 'Calculus II – Full Semester Notes',
        price: 10.00,
        description: 'All Calc II notes: integration techniques, series, polar coords, and more. Color-coded and well-organized. Got an A in the course!',
        category: 'notes',
        condition: 'New',
        sellerId: 'user-20',
        images: ['https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600'],
        createdAt: new Date(Date.now() - 4 * 24 * 3600000).toISOString()
    },

    // ──────────── TRANSPORT ────────────
    {
        id: '21',
        title: 'Electric Scooter – Segway Ninebot',
        price: 280.00,
        description: 'Segway Ninebot ES2, max range ~15 miles. Perfect commuter for campus. Top speed 15 mph. Folds for easy storage. Charger included.',
        category: 'transport',
        condition: 'Good',
        sellerId: 'user-21',
        images: ['https://images.unsplash.com/photo-1604868189266-e4fdada5e3b7?w=600'],
        createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString()
    },

    // ──────────── SERVICES ────────────
    {
        id: '22',
        title: 'Calculus Tutoring – Rs 20/hr',
        price: 20.00,
        description: 'I offer one-on-one calculus tutoring (Calc I, II, III). Engineering junior with A in all math courses. Available evenings and weekends. Can meet at the library.',
        category: 'services',
        condition: 'New',
        sellerId: 'user-22',
        images: ['https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600'],
        createdAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString()
    },
    {
        id: '23',
        title: 'Resume & Cover Letter Review',
        price: 15.00,
        description: 'I will review and improve your resume and cover letter. Business major with internship experience at two Fortune 500 companies. Turnaround in 24 hours.',
        category: 'services',
        condition: 'New',
        sellerId: 'user-23',
        images: ['https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600'],
        createdAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString()
    },
];

// Get all listings
exports.getAllListings = async (req, res) => {
    try {
        const { category } = req.query;
        let result = listings;

        if (category && category !== 'all') {
            result = listings.filter(l => l.category === category);
        }

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching listings', error });
    }
};

// Get single listing
exports.getListingById = async (req, res) => {
    try {
        const listing = listings.find(l => l.id === req.params.id);
        if (!listing) return res.status(404).json({ message: 'Listing not found' });

        res.status(200).json(listing);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching listing', error });
    }
};

// Create new listing
exports.createListing = async (req, res) => {
    try {
        const { title, price, description, category, condition, isNegotiable, image } = req.body;

        const newListing = {
            id: Date.now().toString(),
            title,
            price: parseFloat(price),
            description,
            category,
            condition,
            isNegotiable,
            images: image ? [image] : [],
            sellerId: req.user ? req.user.uid : 'dev-user-123',
            createdAt: new Date().toISOString()
        };

        listings.unshift(newListing);
        console.log('New listing created:', newListing.id);
        res.status(201).json(newListing);
    } catch (error) {
        console.error('Error in createListing:', error);
        res.status(500).json({ message: 'Error creating listing', error: error.message });
    }
};

// Delete a listing
exports.deleteListing = async (req, res) => {
    try {
        const { id } = req.params;
        listings = listings.filter(l => l.id !== id);
        res.status(200).json({ message: 'Listing deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting listing', error });
    }
};

// Get listings belonging to the authenticated user
exports.getMyListings = async (req, res) => {
    try {
        const userId = req.user ? req.user.uid : 'dev-user-123';
        const my = listings.filter(l => l.sellerId === userId);
        res.status(200).json(my);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching my listings', error });
    }
};

// Get saved listings for the user
exports.getSavedListings = async (req, res) => {
    try {
        // Mock: return first 3 listings as "saved" for demo
        const saved = listings.slice(0, 3);
        res.status(200).json(saved);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching saved listings', error });
    }
};

// Search listings
exports.searchListings = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(200).json(listings);

        const results = listings.filter(l =>
            l.title.toLowerCase().includes(q.toLowerCase()) ||
            l.description.toLowerCase().includes(q.toLowerCase())
        );

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: 'Error searching listings', error });
    }
};
