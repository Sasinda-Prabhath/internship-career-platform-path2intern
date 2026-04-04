import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from './src/models/user.model.js';
import { Portfolio } from './src/models/portfolio.model.js';

dotenv.config();

async function seedTestPortfolio() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Create or find test user
    let user = await User.findOne({ email: 'sainda@test.com' });
    if (!user) {
      user = await User.create({
        email: 'sainda@test.com',
        name: 'Sainda Test',
        password: 'hashedpassword123', // This would be hashed in real scenario
        globalRole: 'STUDENT'
      });
      console.log('Created test user:', user.email);
    } else {
      console.log('Test user already exists:', user.email);
    }

    // Create or update portfolio
    const portfolio = await Portfolio.findOneAndUpdate(
      { username: 'sainda' },
      {
        userId: user._id,
        username: 'sainda',
        name: 'Sainda Test',
        headline: 'Full Stack Developer | Problem Solver',
        bio: 'Passionate about building scalable applications and solving real-world problems. Currently exploring cloud technologies and modern development practices.',
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Express', 'REST APIs', 'Git', 'CSS'],
        projects: [
          {
            title: 'Internship Career Platform',
            description: 'A comprehensive platform helping students find internships and build their portfolios.',
            url: 'https://github.com/example/internship-platform',
            tech: ['React', 'Node.js', 'MongoDB', 'Express']
          },
          {
            title: 'AI Chat Application',
            description: 'Real-time messaging application with AI integration for smart replies.',
            url: 'https://github.com/example/ai-chat',
            tech: ['React', 'WebSocket', 'Python', 'NLP']
          }
        ],
        education: 'Bachelor of Computer Science, Tech University (2024)',
        socialLinks: {
          github: 'https://github.com/sainda',
          linkedin: 'https://linkedin.com/in/sainda',
          twitter: 'https://twitter.com/sainda',
          website: 'https://sainda.dev'
        },
        theme: 'light',
        isPublished: false // Development mode - not published but visible
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log('Portfolio created/updated:', portfolio.username);
    console.log('You can now view it at: http://localhost:5173/u/sainda');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding portfolio:', error.message);
    process.exit(1);
  }
}

seedTestPortfolio();
