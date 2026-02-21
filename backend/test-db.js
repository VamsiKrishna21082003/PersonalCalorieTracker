require('dotenv').config();
const { PrismaClient } = require('./src/generated/prisma/client');

async function test() {
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
  
  try {
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✓ Connected to database');
    
    // Try to query users table
    const users = await prisma.user.findMany();
    console.log(`✓ Found ${users.length} users`);
    
    await prisma.$disconnect();
    console.log('✓ Disconnected');
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

test();
