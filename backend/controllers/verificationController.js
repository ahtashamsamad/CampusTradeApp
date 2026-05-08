// Controller for handling university student verification

exports.verifyUniversityEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // In a real app, this would send an email with a verification link
        // For now, we'll just check if it ends in .edu as a basic validation
        if (!email.toLowerCase().endsWith('.edu')) {
            return res.status(400).json({
                message: 'Invalid email domain. Must be a .edu email address.',
                verified: false
            });
        }

        // Mock successful verification process initiation
        res.status(200).json({
            message: 'Verification email sent successfully. Please check your inbox.',
            verified: true // Returning true immediately for dev purposes
        });

    } catch (error) {
        res.status(500).json({ message: 'Error processing verification', error });
    }
};
