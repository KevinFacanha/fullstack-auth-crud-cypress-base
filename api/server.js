import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (replace with database in production)
const users = [
  {
    id: 1,
    email: 'admin@example.com',
    password: bcrypt.hashSync('123456', 10),
    name: 'Administrator'
  },
  {
    id: 2,
    email: 'user@example.com',
    password: bcrypt.hashSync('password', 10),
    name: 'Regular User'
  }
];

let products = [
  {
    id: 1,
    name: 'iPhone 15 Pro',
    price: 999.99,
    category: 'Electronics',
    description: 'Latest iPhone with advanced features',
    stock: 50,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: 'MacBook Air M3',
    price: 1299.99,
    category: 'Electronics',
    description: 'Powerful laptop for professionals',
    stock: 25,
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    name: 'AirPods Pro',
    price: 249.99,
    category: 'Electronics',
    description: 'Wireless earbuds with noise cancellation',
    stock: 100,
    createdAt: new Date().toISOString()
  }
];

let nextProductId = 4;

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all products (protected)
app.get('/api/produtos', authenticateToken, (req, res) => {
  res.json(products);
});

// Get single product (protected)
app.get('/api/produtos/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const product = products.find(p => p.id === id);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  res.json(product);
});

// Create product (protected)
app.post('/api/produtos', authenticateToken, (req, res) => {
  try {
    const { name, price, category, description, stock } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    const newProduct = {
      id: nextProductId++,
      name,
      price: parseFloat(price),
      category,
      description: description || '',
      stock: parseInt(stock) || 0,
      createdAt: new Date().toISOString()
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product (protected)
app.put('/api/produtos/:id', authenticateToken, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, price, category, description, stock } = req.body;

    products[productIndex] = {
      ...products[productIndex],
      name: name || products[productIndex].name,
      price: price !== undefined ? parseFloat(price) : products[productIndex].price,
      category: category || products[productIndex].category,
      description: description !== undefined ? description : products[productIndex].description,
      stock: stock !== undefined ? parseInt(stock) : products[productIndex].stock,
      updatedAt: new Date().toISOString()
    };

    res.json(products[productIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product (protected)
app.delete('/api/produtos/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const productIndex = products.findIndex(p => p.id === id);

  if (productIndex === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  products.splice(productIndex, 1);
  res.status(204).send();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running!' });
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});