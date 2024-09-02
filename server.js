const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const ChatMessage = require('./models/ChatMessage');
const News = require('./models/News');
const mongoose = require('mongoose');
const User = require('./models/User');
const auth = require('./middleware/auth');
const notifications = require('./routes/notification');  // Import the notifications route
const JobApplication = require('./routes/JobApplication')
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

connectDB();

app.use(bodyParser.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve static files from uploads directory
app.use('/api/matching', require('./routes/matching')); // New matching route
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/jobPost', require('./routes/jobPosts'));
app.use('/api/studentRequest', require('./routes/studentRequests'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/news', require('./routes/news')); // Include the news routes
app.use('/api/notification', require('./routes/notification'));  // Use the notifications route
app.use('/api/JobApplication',require('./routes/JobApplication'));
// Set up multer for image uploads
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    },
});

const upload = multer({ storage });

const rooms = {}; // This will store room information

// Socket.io connection for real-time chat
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinRoom', ({ userId, recipientId }) => {
        const room = [userId, recipientId].sort().join('_');
        socket.join(room);

        // Store the room info
        if (!rooms[userId]) {
            rooms[userId] = new Set();
        }
        rooms[userId].add(room);

        if (!rooms[recipientId]) {
            rooms[recipientId] = new Set();
        }
        rooms[recipientId].add(room);

        console.log(`User ${userId} joined room ${room}`);
    });

    socket.on('chatMessage', async ({ userId, recipientId, contextId, message }) => {
        console.log('Received message with:', { userId, recipientId, contextId, message });
        try {
            // Ensure recipientId is valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(recipientId)) {
                throw new Error('Invalid recipient ID');
            }

            const room = [userId, recipientId].sort().join('_');

            const newMessage = new ChatMessage({
                sender: userId,
                recipient: recipientId,
                message,
                timestamp: Date.now(),
            });

            await newMessage.save();
            
            const sender = await User.findById(userId); // Get sender's name

            io.to(room).emit('message', {
                sender:{
                  _id:userId,
                  name: sender.name
                },
                message,
                timestamp: newMessage.timestamp,
                _id:newMessage._id,
              });
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Endpoint to get the list of rooms for a user
app.get('/api/chat/rooms/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const userRooms = rooms[userId] ? Array.from(rooms[userId]) : [];

        // Fetch user details for each room (e.g., name, profile picture)
        const roomDetails = await Promise.all(userRooms.map(async (room) => {
            const [id1, id2] = room.split('_');
            const otherUserId = id1 === userId ? id2 : id1;
            const user = await User.findById(otherUserId).select('name profilePicture');
            return { room, user };
        }));

        res.json({ rooms: roomDetails });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).send('Server error');
    }
});

// Admin routes for managing users
app.get('/api/admin/users', auth, async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user.id } }); // Exclude the current user
        res.json(users);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

app.delete('/api/admin/users/:id', auth, async (req, res) => {
    try {
        const userId = req.params.id; 
  
        const user = await User.findByIdAndDelete(userId);
  
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
  
        res.json({ msg: 'User deleted' }); // Send a success message
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).send('Server error');
    }
});

// News endpoints
app.post('/api/news', [auth, upload.single('image')], async (req, res) => {
    try {
        const { title, content, category } = req.body;
        const image = req.file ? req.file.filename : null;

        const news = new News({ title, content, category, image, author: req.user.id });
        await news.save();

        res.json(news);
    } catch (err) {
        console.error('Error posting news:', err);
        res.status(500).send('Server error');
    }
});

app.get('/api/news', async (req, res) => {
    try {
        const newsList = await News.find().sort({ createdAt: -1 });
        res.json(newsList);
    } catch (err) {
        console.error('Error fetching news:', err);
        res.status(500).send('Server error');
    }
});

// Ensure that uploads directory exists
const fs = require('fs');
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Start the server
const PORT = process.env.PORT || 3080;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
