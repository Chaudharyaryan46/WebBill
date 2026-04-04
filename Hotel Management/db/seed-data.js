// Seed data for the restaurant management system

const tables = [
  { number: 1, capacity: 2 },
  { number: 2, capacity: 2 },
  { number: 3, capacity: 4 },
  { number: 4, capacity: 4 },
  { number: 5, capacity: 4 },
  { number: 6, capacity: 6 },
  { number: 7, capacity: 6 },
  { number: 8, capacity: 4 },
  { number: 9, capacity: 2 },
  { number: 10, capacity: 8 },
  { number: 11, capacity: 4 },
  { number: 12, capacity: 6 },
];

const staff = [
  { name: 'Rahul', role: 'waiter', pin: '1234' },
  { name: 'Priya', role: 'waiter', pin: '5678' },
  { name: 'Amit', role: 'waiter', pin: '9012' },
  { name: 'Admin', role: 'counter', pin: '0000' },
  { name: 'Manager', role: 'manager', pin: '1111' },
];

const menuItems = [
  // ─── STARTERS ───
  { name: 'Paneer Tikka', category: 'Starters', price: 280, description: 'Marinated cottage cheese grilled in tandoor with bell peppers', image_url: '/images/paneer-tikka.jpg', veg: 1 },
  { name: 'Chicken Tikka', category: 'Starters', price: 320, description: 'Succulent chicken pieces marinated in spiced yogurt, chargrilled', image_url: '/images/chicken-tikka.jpg', veg: 0 },

  // ─── MAIN COURSE ───
  { name: 'Butter Chicken', category: 'Main Course', price: 380, description: 'Tender chicken in rich tomato-butter gravy', image_url: '/images/butter-chicken.jpg', veg: 0 },
  { name: 'Dal Makhani', category: 'Main Course', price: 280, description: 'Slow-cooked black lentils in creamy butter sauce', image_url: '/images/dal-makhani.jpg', veg: 1 },
  { name: 'Chicken Biryani', category: 'Main Course', price: 350, description: 'Fragrant basmati rice layered with spiced chicken', image_url: '/images/chicken-biryani.jpg', veg: 0 },

  // ─── SIDES (BREADS & RICE) ───
  { name: 'Butter Naan', category: 'Sides', price: 60, description: 'Soft leavened bread brushed with butter', image_url: '/images/butter-naan.jpg', veg: 1 },
  { name: 'Jeera Rice', category: 'Sides', price: 150, description: 'Basmati rice tempered with cumin seeds', image_url: '/images/jeera-rice.jpg', veg: 1 },

  // ─── DRINKS & DESSERTS ───
  { name: 'Masala Chai', category: 'Drinks & Desserts', price: 60, description: 'Traditional Indian spiced tea', image_url: '/images/masala-chai.jpg', veg: 1 },
  { name: 'Mango Lassi', category: 'Drinks & Desserts', price: 130, description: 'Creamy yogurt drink with mango pulp', image_url: '/images/mango-lassi.jpg', veg: 1 },
  { name: 'Gulab Jamun', category: 'Drinks & Desserts', price: 120, description: 'Deep-fried milk dumplings in sugar syrup', image_url: '/images/gulab-jamun.jpg', veg: 1 },
];

module.exports = { tables, staff, menuItems };

