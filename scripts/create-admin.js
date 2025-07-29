const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

// Import from the generated Prisma client location
const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...')
    
    // Admin user details
    const adminEmail = 'admin@silverstore.com'
    const adminPassword = 'admin123' // Change this to a secure password
    const adminName = 'Admin User'
    
    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    })
    
    if (existingUser) {
      console.log('⚠️  Admin user already exists with email:', adminEmail)
      
      // Update existing user to admin role if not already
      if (existingUser.role !== 'ADMIN') {
        await prisma.user.update({
          where: { email: adminEmail },
          data: { role: 'ADMIN' }
        })
        console.log('✅ Updated existing user to ADMIN role')
      }
      
      console.log('📧 Email:', adminEmail)
      console.log('🔑 Password: admin123 (if this is a new user)')
      return
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        role: 'ADMIN'
      }
    })
    
    console.log('✅ Admin user created successfully!')
    console.log('📧 Email:', adminUser.email)
    console.log('🔑 Password:', adminPassword)
    console.log('👤 Name:', adminUser.name)
    console.log('🛡️  Role:', adminUser.role)
    console.log('')
    console.log('🚀 You can now sign in to the admin panel at: http://localhost:3001/admin')
    console.log('⚠️  Please change the password after first login!')
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    
    if (error.code === 'P2002') {
      console.log('💡 User with this email already exists. Try updating the existing user to admin role.')
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createAdminUser()
