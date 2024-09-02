const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { upload, uploadMiddleware } = require('../middleware/imageUpload');
const News = require('../models/News');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Create a news post
router.post('/create', auth, upload.single('image'), uploadMiddleware, async (req, res) => {
    try {
        const { title, content, category,image } = req.body;
        const imageUrl = req.fileUrl || null;
        console.log(image);
        //console.log(imageUrl);
        const news = new News({
            title,
            content,
            category,
            image: imageUrl,
            author: req.user.id,
        });

        await news.save();

        // Notify all users about the new news post
        const users = await User.find();
        const notifications = users.map(user => ({
            userId: user._id,
            message: `Check out the new news: "${news.title}"`,
            newsId: news._id,
            read: false,
        }));

        await Notification.insertMany(notifications);

        res.json(news);
    } catch (err) {
        console.error('Error creating news:', err);
        res.status(500).send('Server error');
    }
});

// Get all news posts
router.get('/', auth, async (req, res) => {
    try {
        const news = await News.find();
        res.json(news);
    } catch (err) {
        console.error('Error fetching news:', err);
        res.status(500).send('Server error');
    }
});

// Delete a news post
router.delete('/:id', auth, async (req, res) => {
    try {
        const newsId = req.params.id;
  
        const news = await News.findByIdAndDelete(newsId);
  
        
        if (!news) {
            return res.status(404).json({ msg: 'News post not found' });
        }

        res.json({ msg: 'News post removed' }); // Send a success message
    } catch (err) {
        console.error('Error deleting news:', err);
        
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'News post not found' });
        }
        
        res.status(500).send('Server error');
    }
});


// Edit a news post (assuming it uses the same form as creation)
router.put('/:id', auth, upload.single('image'), uploadMiddleware, async (req, res) => {
    const { title, content, category } = req.body;
    const imageUrl = req.fileUrl || null;

    try {
        let news = await News.findById(req.params.id);

        if (!news) return res.status(404).json({ msg: 'News post not found' });

        // Ensure the logged-in user is the author
        if (news.author.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        news.title = title || news.title;
        news.content = content || news.content;
        news.category = category || news.category;
        if (imageUrl) news.image = imageUrl;

        await news.save();
        res.json(news);
    } catch (err) {
        console.error('Error updating news:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
