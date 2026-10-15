const cors = require('cors');
const express = require('express');
const prisma = require('./prismaClient');
const authenticateToken = require('./authMiddleware');

const app = express();
const PORT = 5000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use('/api/auth', require('./auth'));

// Home route
app.get('/', (req, res) => {
  res.send('Product Management API is running!');
});

// Convert database values to JSON-safe values
function toProductJSON(product) {
  return {
    ...product,
    id: product.id.toString(),
    user_id: product.user_id.toString(),
    price: product.price.toString()
  };
}

// Get products belonging to the logged-in user
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const products = await prisma.products.findMany({
      where: { user_id: BigInt(req.user.id) },
      orderBy: { id: 'asc' }
    });

    res.json(products.map(toProductJSON));
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create a product
app.post('/api/products', authenticateToken, async (req, res) => {
  console.log('CREATE PRODUCT REQUEST RECEIVED');
  const { name, price } = req.body;
  const numericPrice = Number(price);

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    price === '' ||
    price === null ||
    price === undefined ||
    !Number.isFinite(numericPrice) ||
    numericPrice < 0
  ) {
    return res.status(400).json({
      error: 'Enter a product name and a valid non-negative price'
    });
  }

  try {
    const product = await prisma.products.create({
      data: {
        name: name.trim(),
        price: numericPrice,
        user_id: BigInt(req.user.id)
      }
    });

    res.status(201).json(toProductJSON(product));
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update a product belonging to the logged-in user
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  const id = req.params.id;
  const { name, price } = req.body;
  const numericPrice = Number(price);

  if (
    !/^[1-9]\d*$/.test(id) ||
    typeof name !== 'string' ||
    !name.trim() ||
    price === '' ||
    price === null ||
    price === undefined ||
    !Number.isFinite(numericPrice) ||
    numericPrice < 0
  ) {
    return res.status(400).json({
      error: 'Enter a valid product ID, name and non-negative price'
    });
  }

  try {
    const result = await prisma.products.updateMany({
      where: {
        id: BigInt(id),
        user_id: BigInt(req.user.id)
      },
      data: {
        name: name.trim(),
        price: numericPrice
      }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = await prisma.products.findFirst({
      where: {
        id: BigInt(id),
        user_id: BigInt(req.user.id)
      }
    });

    res.json(toProductJSON(product));
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete a product belonging to the logged-in user
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  const id = req.params.id;

  if (!/^[1-9]\d*$/.test(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  try {
    const result = await prisma.products.deleteMany({
      where: {
        id: BigInt(id),
        user_id: BigInt(req.user.id)
      }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
