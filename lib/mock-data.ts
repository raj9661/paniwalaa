// Mock data for development without database
export const mockUsers = [
  {
    id: '1',
    email: 'customer@test.com',
    phone: '9876543210',
    name: 'Rajesh Kumar',
    role: 'customer' as const,
    status: 'active' as const,
  },
  {
    id: '2',
    email: 'delivery@test.com',
    phone: '9876543211',
    name: 'Amit Singh',
    role: 'delivery_partner' as const,
    status: 'active' as const,
  },
  {
    id: '3',
    email: 'admin@test.com',
    phone: '9876543212',
    name: 'Admin User',
    role: 'admin' as const,
    status: 'active' as const,
  },
]

export const mockProducts = [
  {
    id: '1',
    name: 'Bisleri 20L Jar',
    description: 'Pure and safe drinking water',
    price: 65.0,
    brand: 'Bisleri',
    is_available: true,
    image_url: '/bisleri-water-jar.jpg',
  },
  {
    id: '2',
    name: 'Aquafina 20L Jar',
    description: 'Trusted water brand',
    price: 60.0,
    brand: 'Aquafina',
    is_available: true,
    image_url: '/aquafina-water-jar.jpg',
  },
  {
    id: '3',
    name: 'Kinley 20L Jar',
    description: 'Coca-Cola trusted water',
    price: 62.0,
    brand: 'Kinley',
    is_available: true,
    image_url: '/kinley-water-jar.jpg',
  },
  {
    id: '4',
    name: 'Rail Neer 20L Jar',
    description: 'Indian Railways premium water',
    price: 55.0,
    brand: 'Rail Neer',
    is_available: true,
    image_url: '/rail-neer-water-jar.jpg',
  },
]

export const mockAddresses = [
  {
    id: '1',
    user_id: '1',
    label: 'Home',
    address_line: 'A-123, Sector 5',
    landmark: 'Near Metro Station',
    area: 'Laxmi Nagar',
    city: 'Delhi',
    pincode: '110092',
    is_default: true,
  },
]
