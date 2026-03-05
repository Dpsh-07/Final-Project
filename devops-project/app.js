const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = 4000;

// Middleware
app.use(bodyParser.json());

// Root route - shows something useful when visiting in browser
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Task Manager API is running 🚀',
    description: 'Simple REST API for managing tasks',
    availableEndpoints: [
      'GET    /               → This welcome message',
      'GET    /health         → Server health check',
      'GET    /tasks          → List all tasks',
      'POST   /tasks          → Create new task (body: { "title": "..." })',
      'PUT    /tasks/:id      → Update task (body: { "completed": true/false, "title": "..." })',
      'DELETE /tasks/:id      → Delete a task'
    ],
    example: 'Try: curl -X POST http://localhost:4000/tasks -H "Content-Type: application/json" -d \'{"title":"Learn Docker"}\''
  });
});

// Health check endpoint (useful for Docker/Kubernetes)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// MongoDB connection
const mongoUrl = process.env.MONGO_URL || 'mongodb://mongo:27017/tasksdb';

mongoose.connect(mongoUrl)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Task Schema
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Task = mongoose.model('Task', taskSchema);

// Routes
app.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks', details: err.message });
  }
});

app.post('/tasks', async (req, res) => {
  try {
    const task = new Task({ title: req.body.title });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create task', details: err.message });
  }
});

app.put('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { 
        title: req.body.title,
        completed: req.body.completed 
      },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update task', details: err.message });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully', deletedId: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task', details: err.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Task API running on http://localhost:${port}`);
});
