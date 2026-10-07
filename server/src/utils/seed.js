// ─── SkillSwap demo seed data ────────────────────────────────────────────────
// ⚠️  DEMO DATA ONLY — never used in production code. The passwords below are
// for local demo accounts so the matching feature can be tried immediately.
// Run with: npm run seed
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Skill = require('../models/Skill');
const SwapRequest = require('../models/SwapRequest');
const Review = require('../models/Review');

dotenv.config();

const DEMO_PASSWORD = 'password123'; // demo accounts only

const SKILLS = [
  { name: 'React', category: 'Frontend' },
  { name: 'JavaScript', category: 'Programming' },
  { name: 'TypeScript', category: 'Programming' },
  { name: 'Node.js', category: 'Backend' },
  { name: 'Express.js', category: 'Backend' },
  { name: 'MongoDB', category: 'Database' },
  { name: 'PostgreSQL', category: 'Database' },
  { name: 'Docker', category: 'DevOps' },
  { name: 'AWS', category: 'Cloud' },
  { name: 'Kubernetes', category: 'DevOps' },
  { name: 'Figma', category: 'Design' },
  { name: 'Python', category: 'Programming' },
];

// Teach/want sets are deliberately complementary so matches are demonstrable:
// e.g. Srijan teaches React/JS and wants Docker/AWS, while Rahul teaches
// Docker/AWS and wants React — a textbook 2-way match.
const USERS = [
  {
    name: 'Srijan Kumar',
    email: 'srijan@demo.com',
    bio: 'Full-stack developer who loves React and wants to go deeper into DevOps.',
    location: 'Bettiah, Bihar',
    experienceLevel: 'Intermediate',
    availability: 'Evenings',
    teach: ['React', 'JavaScript', 'MongoDB'],
    learn: ['Docker', 'AWS'],
  },
  {
    name: 'Rahul Sharma',
    email: 'rahul@demo.com',
    bio: 'DevOps engineer exploring frontend development.',
    location: 'Pune, Maharashtra',
    experienceLevel: 'Advanced',
    availability: 'Weekends',
    teach: ['Docker', 'AWS', 'Kubernetes'],
    learn: ['React', 'JavaScript'],
  },
  {
    name: 'Priya Patel',
    email: 'priya@demo.com',
    bio: 'Backend developer with Python, learning modern frontend.',
    location: 'Ahmedabad, Gujarat',
    experienceLevel: 'Intermediate',
    availability: 'Weekdays',
    teach: ['Python', 'PostgreSQL'],
    learn: ['React', 'TypeScript'],
  },
  {
    name: 'Arjun Mehta',
    email: 'arjun@demo.com',
    bio: 'MERN developer who wants to learn design.',
    location: 'Jaipur, Rajasthan',
    experienceLevel: 'Beginner',
    availability: 'Evenings',
    teach: ['Node.js', 'Express.js', 'MongoDB'],
    learn: ['Figma', 'AWS'],
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha@demo.com',
    bio: 'UI designer who codes in JavaScript.',
    location: 'Hyderabad, Telangana',
    experienceLevel: 'Intermediate',
    availability: 'Flexible',
    teach: ['Figma', 'JavaScript'],
    learn: ['Node.js', 'MongoDB'],
  },
  {
    name: 'Vikram Singh',
    email: 'vikram@demo.com',
    bio: 'Frontend engineer moving into platform engineering.',
    location: 'Delhi, India',
    experienceLevel: 'Advanced',
    availability: 'Weekdays',
    teach: ['TypeScript', 'React'],
    learn: ['Kubernetes', 'Docker'],
  },
];

const seed = async () => {
  await connectDB();

  // Start clean so re-running the seed never creates duplicates.
  await Promise.all([
    User.deleteMany({}),
    Skill.deleteMany({}),
    SwapRequest.deleteMany({}),
    Review.deleteMany({}),
  ]);

  const skills = await Skill.insertMany(SKILLS);
  const skillByName = Object.fromEntries(skills.map((s) => [s.name, s._id]));
  console.log(`Created ${skills.length} skills`);

  const createdUsers = [];
  for (const u of USERS) {
    const user = await User.create({
      name: u.name,
      email: u.email,
      password: DEMO_PASSWORD, // hashed by the User model's pre('save') hook
      bio: u.bio,
      location: u.location,
      experienceLevel: u.experienceLevel,
      availability: u.availability,
      skillsToTeach: u.teach.map((name) => skillByName[name]),
      skillsToLearn: u.learn.map((name) => skillByName[name]),
    });
    createdUsers.push(user);
  }
  console.log(`Created ${createdUsers.length} demo users`);

  // One completed swap + review so the reviews feature is visible in the demo.
  const [srijan, rahul] = createdUsers;
  const swap = await SwapRequest.create({
    sender: rahul._id,
    receiver: srijan._id,
    offeredSkill: skillByName['Docker'],
    requestedSkill: skillByName['React'],
    message: 'Happy to walk you through Docker if you can help me with React hooks!',
    status: 'Completed',
    // Two-sided completion: both participants marked their side done.
    senderCompleted: true,
    receiverCompleted: true,
  });
  await Review.create({
    reviewer: srijan._id,
    reviewedUser: rahul._id,
    swapRequest: swap._id,
    rating: 5,
    comment: 'Great at explaining Docker concepts step by step.',
  });
  // Keep the denormalized rating in sync (same logic as the review controller).
  await User.findByIdAndUpdate(rahul._id, { rating: 5, ratingCount: 1 });
  console.log('Created 1 completed demo swap with a review');

  console.log('\nSeed complete. Demo logins (password for all: password123):');
  for (const u of USERS) console.log(`  - ${u.email}`);

  await mongoose.connection.close();
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
