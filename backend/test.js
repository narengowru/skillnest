const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const Freelancer = require('./models/Freelancer'); // Adjust path if needed

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    return insertFreelancers();
  })
  .then(result => {
    console.log(`${result.length} freelancers inserted successfully`);
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.connection.close();
  });

// Function to insert freelancers
async function insertFreelancers() {
  try {
    // Create sample freelancers with realistic data
    const freelancerData = [
      {
        name: "Alex Johnson",
        tagline: "Full Stack Developer | React & Node.js Specialist",
        profilePhoto: "https://i.ibb.co/randomphoto1",
        bio: "Full stack developer with 5+ years of experience building scalable web applications. Specialized in React, Node.js, and MongoDB. Passionate about clean code and user-friendly interfaces.",
        email: "alex.johnson@example.com",
        phone: "+1 (555) 123-4567",
        password: await bcrypt.hash("password123", 10),
        achievements: [
          {
            title: "Top Rated Freelancer",
            icon: "trophy",
            date: "2023-09-15"
          },
          {
            title: "Rising Talent",
            icon: "star",
            date: "2022-04-10"
          }
        ],
        education: {
          university: "University of California, Berkeley",
          degree: "B.S. Computer Science",
          year: "2018",
          gpa: "3.8",
          relevantCourses: ["Data Structures", "Algorithms", "Web Development", "Database Systems"]
        },
        previousWork: [
          {
            title: "E-commerce Platform",
            description: "Developed a full-stack e-commerce platform with React, Node.js and MongoDB",
            image: "https://i.ibb.co/project1",
            client: "Digital Retail Solutions",
            feedback: "Alex delivered exceptional work on our e-commerce platform. Highly recommended!"
          },
          {
            title: "Task Management App",
            description: "Created a responsive task management application with real-time updates",
            image: "https://i.ibb.co/project2",
            client: "ProductiveWorks Inc.",
            feedback: "Outstanding attention to detail and excellent communication throughout the project."
          }
        ],
        skills: [
          { name: "JavaScript", level: 95 },
          { name: "React", level: 90 },
          { name: "Node.js", level: 85 },
          { name: "MongoDB", level: 80 },
          { name: "TypeScript", level: 75 }
        ],
        hourlyRate: "$65",
        availability: {
          hoursPerWeek: 30,
          schedule: "Weekdays, some weekends"
        },
        jobsCompleted: 47,
        ratings: {
          average: 4.9,
          breakdown: {
            5: 42,
            4: 5,
            3: 0,
            2: 0,
            1: 0
          },
          total: 47
        },
        reviews: [
          {
            clientName: "Sarah Miller",
            clientAvatar: "https://i.ibb.co/client1",
            rating: 5,
            date: "2024-02-15",
            comment: "Alex is a fantastic developer! Fast, efficient, and very professional."
          },
          {
            clientName: "Michael Chen",
            clientAvatar: "https://i.ibb.co/client2",
            rating: 5,
            date: "2023-12-10",
            comment: "Great communication and exceptional coding skills. Will hire again."
          }
        ],
        orders: [
          {
            id: "ORD-12345",
            client: "Digital Retail Solutions",
            project: "E-commerce Platform",
            amount: "$3,250",
            status: "completed",
            date: "2024-01-20"
          },
          {
            id: "ORD-23456",
            client: "ProductiveWorks Inc.",
            project: "Task Management App",
            amount: "$1,800",
            status: "completed",
            date: "2023-11-05"
          }
        ],
        location: "San Francisco, CA",
        joinedDate: "2022-03-15",
        languages: ["English", "Spanish"],
        socialProfiles: {
          github: "https://github.com/alexjdev",
          linkedin: "https://linkedin.com/in/alexjohnson",
          portfolio: "https://alexjohnson.dev"
        }
      },
      {
        name: "Emma Rodriguez",
        tagline: "UI/UX Designer | Brand Identity Specialist",
        profilePhoto: "https://i.ibb.co/randomphoto2",
        bio: "Creative UI/UX designer with a strong focus on user-centered design. 6+ years of experience crafting intuitive interfaces and compelling brand identities that drive engagement and conversion.",
        email: "emma.rodriguez@example.com",
        phone: "+1 (555) 234-5678",
        password: await bcrypt.hash("designpro456", 10),
        achievements: [
          {
            title: "Design Excellence Award",
            icon: "medal",
            date: "2023-11-20"
          }
        ],
        education: {
          university: "Rhode Island School of Design",
          degree: "BFA in Graphic Design",
          year: "2017",
          gpa: "3.9",
          relevantCourses: ["UI Design", "Typography", "Visual Communication", "User Research"]
        },
        previousWork: [
          {
            title: "Finance App Redesign",
            description: "Complete redesign of a financial services mobile application, focusing on user experience",
            image: "https://i.ibb.co/project3",
            client: "FinTech Solutions",
            feedback: "Emma's design significantly improved our user engagement metrics. Outstanding work!"
          },
          {
            title: "Brand Identity System",
            description: "Developed comprehensive brand identity for a startup, including logo, style guide and marketing materials",
            image: "https://i.ibb.co/project4",
            client: "EcoStart Inc.",
            feedback: "Emma captured our vision perfectly. Her designs have been instrumental in our brand recognition."
          }
        ],
        skills: [
          { name: "UI Design", level: 95 },
          { name: "UX Research", level: 90 },
          { name: "Adobe Creative Suite", level: 95 },
          { name: "Figma", level: 90 },
          { name: "Sketch", level: 85 }
        ],
        hourlyRate: "$70",
        availability: {
          hoursPerWeek: 25,
          schedule: "Weekdays, flexible hours"
        },
        jobsCompleted: 38,
        ratings: {
          average: 4.8,
          breakdown: {
            5: 32,
            4: 6,
            3: 0,
            2: 0,
            1: 0
          },
          total: 38
        },
        reviews: [
          {
            clientName: "David Park",
            clientAvatar: "https://i.ibb.co/client3",
            rating: 5,
            date: "2024-03-05",
            comment: "Emma's designs are both beautiful and functional. She really understands user needs."
          },
          {
            clientName: "Jennifer Wu",
            clientAvatar: "https://i.ibb.co/client4",
            rating: 4,
            date: "2024-01-12",
            comment: "Creative solutions and very responsive to feedback. Great experience overall."
          }
        ],
        orders: [
          {
            id: "ORD-34567",
            client: "FinTech Solutions",
            project: "Finance App Redesign",
            amount: "$3,500",
            status: "completed",
            date: "2024-02-15"
          },
          {
            id: "ORD-45678",
            client: "EcoStart Inc.",
            project: "Brand Identity System",
            amount: "$2,800",
            status: "completed",
            date: "2023-12-20"
          }
        ],
        location: "Boston, MA",
        joinedDate: "2021-09-28",
        languages: ["English", "Portuguese"],
        socialProfiles: {
          github: "https://github.com/emmadesign",
          linkedin: "https://linkedin.com/in/emmarodriguez",
          portfolio: "https://emmarodriguez.design"
        }
      },
      {
        name: "Raj Patel",
        tagline: "Backend Developer | DevOps Engineer",
        profilePhoto: "https://i.ibb.co/randomphoto3",
        bio: "Experienced backend developer and DevOps engineer specializing in Python, Go, and cloud infrastructure. Strong focus on building scalable, secure, and reliable systems.",
        email: "raj.patel@example.com",
        phone: "+1 (555) 345-6789",
        password: await bcrypt.hash("backend789", 10),
        achievements: [
          {
            title: "Cloud Certification",
            icon: "cloud",
            date: "2023-08-05"
          },
          {
            title: "Security Champion",
            icon: "shield",
            date: "2024-01-10"
          }
        ],
        education: {
          university: "Georgia Institute of Technology",
          degree: "M.S. Computer Science",
          year: "2019",
          gpa: "4.0",
          relevantCourses: ["Distributed Systems", "Cloud Computing", "Database Systems", "Network Security"]
        },
        previousWork: [
          {
            title: "Cloud Migration",
            description: "Led the migration of legacy systems to AWS, improving performance and reducing costs",
            image: "https://i.ibb.co/project5",
            client: "Enterprise Solutions Ltd.",
            feedback: "Raj's expertise in cloud infrastructure was invaluable. The migration was seamless."
          },
          {
            title: "API Development",
            description: "Developed a high-performance REST API handling millions of requests daily",
            image: "https://i.ibb.co/project6",
            client: "DataFlow Systems",
            feedback: "Exceptional work on our API. Performance improved by 60% after Raj's implementation."
          }
        ],
        skills: [
          { name: "Python", level: 95 },
          { name: "Go", level: 90 },
          { name: "AWS", level: 95 },
          { name: "Docker", level: 90 },
          { name: "Kubernetes", level: 85 }
        ],
        hourlyRate: "$80",
        availability: {
          hoursPerWeek: 40,
          schedule: "Full-time availability"
        },
        jobsCompleted: 52,
        ratings: {
          average: 4.9,
          breakdown: {
            5: 48,
            4: 4,
            3: 0,
            2: 0,
            1: 0
          },
          total: 52
        },
        reviews: [
          {
            clientName: "Thomas Brown",
            clientAvatar: "https://i.ibb.co/client5",
            rating: 5,
            date: "2024-03-15",
            comment: "Raj is a backend wizard. Our systems are now faster and more reliable."
          },
          {
            clientName: "Lisa Chen",
            clientAvatar: "https://i.ibb.co/client6",
            rating: 5,
            date: "2024-02-20",
            comment: "Top-notch DevOps work. Automated our deployment pipeline and improved security."
          }
        ],
        orders: [
          {
            id: "ORD-56789",
            client: "Enterprise Solutions Ltd.",
            project: "Cloud Migration",
            amount: "$6,400",
            status: "completed",
            date: "2024-02-28"
          },
          {
            id: "ORD-67890",
            client: "DataFlow Systems",
            project: "API Development",
            amount: "$4,200",
            status: "completed",
            date: "2023-11-15"
          }
        ],
        location: "Austin, TX",
        joinedDate: "2021-05-10",
        languages: ["English", "Hindi", "Gujarati"],
        socialProfiles: {
          github: "https://github.com/rajpatel",
          linkedin: "https://linkedin.com/in/rajpatel",
          portfolio: "https://rajpatel.dev"
        }
      },
      {
        name: "Sophia Kim",
        tagline: "Content Writer | SEO Specialist",
        profilePhoto: "https://i.ibb.co/randomphoto4",
        bio: "Professional content writer with expertise in SEO optimization. Helps businesses increase their online visibility through engaging content that ranks well on search engines.",
        email: "sophia.kim@example.com",
        phone: "+1 (555) 456-7890",
        password: await bcrypt.hash("contentpro567", 10),
        achievements: [
          {
            title: "SEO Excellence",
            icon: "chart-up",
            date: "2023-10-15"
          }
        ],
        education: {
          university: "New York University",
          degree: "B.A. English and Communications",
          year: "2020",
          gpa: "3.7",
          relevantCourses: ["Digital Marketing", "Content Strategy", "Search Engine Optimization", "Creative Writing"]
        },
        previousWork: [
          {
            title: "Blog Content Strategy",
            description: "Developed comprehensive content strategy and wrote 30+ blog posts that increased organic traffic by 150%",
            image: "https://i.ibb.co/project7",
            client: "Growth Marketing Inc.",
            feedback: "Sophia's content strategy transformed our blog. Traffic and engagement have increased dramatically."
          },
          {
            title: "Product Description Optimization",
            description: "Rewrote 200+ product descriptions with SEO optimization, boosting conversion rates",
            image: "https://i.ibb.co/project8",
            client: "E-Shop Brands",
            feedback: "Our product pages are now ranking higher and converting better. Excellent work!"
          }
        ],
        skills: [
          { name: "Content Writing", level: 95 },
          { name: "SEO", level: 90 },
          { name: "Keyword Research", level: 90 },
          { name: "Content Strategy", level: 85 },
          { name: "Copywriting", level: 90 }
        ],
        hourlyRate: "$55",
        availability: {
          hoursPerWeek: 30,
          schedule: "Weekdays, flexible hours"
        },
        jobsCompleted: 63,
        ratings: {
          average: 4.8,
          breakdown: {
            5: 51,
            4: 12,
            3: 0,
            2: 0,
            1: 0
          },
          total: 63
        },
        reviews: [
          {
            clientName: "Robert Garcia",
            clientAvatar: "https://i.ibb.co/client7",
            rating: 5,
            date: "2024-02-25",
            comment: "Sophia's content has helped us rank for multiple competitive keywords. Outstanding results."
          },
          {
            clientName: "Amanda Lewis",
            clientAvatar: "https://i.ibb.co/client8",
            rating: 4,
            date: "2024-01-18",
            comment: "Great content that resonates with our audience. Professional and timely delivery."
          }
        ],
        orders: [
          {
            id: "ORD-78901",
            client: "Growth Marketing Inc.",
            project: "Blog Content Strategy",
            amount: "$3,300",
            status: "completed",
            date: "2024-01-30"
          },
          {
            id: "ORD-89012",
            client: "E-Shop Brands",
            project: "Product Description Optimization",
            amount: "$2,750",
            status: "completed",
            date: "2023-12-05"
          }
        ],
        location: "Chicago, IL",
        joinedDate: "2022-01-15",
        languages: ["English", "Korean"],
        socialProfiles: {
          github: "",
          linkedin: "https://linkedin.com/in/sophiakim",
          portfolio: "https://sophiakim.writer"
        }
      },
      {
        name: "Marcus Wilson",
        tagline: "Mobile App Developer | Flutter & React Native Expert",
        profilePhoto: "https://i.ibb.co/randomphoto5",
        bio: "Specialized mobile app developer with extensive experience in Flutter and React Native. Created over 20 published apps with combined downloads exceeding 1 million.",
        email: "marcus.wilson@example.com",
        phone: "+1 (555) 567-8901",
        password: await bcrypt.hash("mobiledev890", 10),
        achievements: [
          {
            title: "App Store Featured",
            icon: "mobile",
            date: "2023-07-20"
          },
          {
            title: "Certified Flutter Developer",
            icon: "certificate",
            date: "2022-09-12"
          }
        ],
        education: {
          university: "Stanford University",
          degree: "B.S. Software Engineering",
          year: "2019",
          gpa: "3.8",
          relevantCourses: ["Mobile App Development", "UI/UX for Mobile", "Cross-Platform Development", "Software Architecture"]
        },
        previousWork: [
          {
            title: "Fitness Tracking App",
            description: "Developed a cross-platform fitness app with social features and performance analytics",
            image: "https://i.ibb.co/project9",
            client: "HealthTech Solutions",
            feedback: "Marcus delivered an exceptional app that exceeded our expectations. User engagement is outstanding."
          },
          {
            title: "E-commerce Mobile App",
            description: "Created a full-featured shopping app with AR product visualization",
            image: "https://i.ibb.co/project10",
            client: "Retail Innovations",
            feedback: "The AR features Marcus implemented have significantly reduced return rates. Outstanding work!"
          }
        ],
        skills: [
          { name: "Flutter", level: 95 },
          { name: "React Native", level: 90 },
          { name: "Swift", level: 85 },
          { name: "Kotlin", level: 80 },
          { name: "Firebase", level: 90 }
        ],
        hourlyRate: "$75",
        availability: {
          hoursPerWeek: 35,
          schedule: "Weekdays and some weekends"
        },
        jobsCompleted: 31,
        ratings: {
          average: 4.9,
          breakdown: {
            5: 29,
            4: 2,
            3: 0,
            2: 0,
            1: 0
          },
          total: 31
        },
        reviews: [
          {
            clientName: "Patricia Moore",
            clientAvatar: "https://i.ibb.co/client9",
            rating: 5,
            date: "2024-03-10",
            comment: "Marcus is a mobile development genius. Our app is performing beyond expectations."
          },
          {
            clientName: "James Taylor",
            clientAvatar: "https://i.ibb.co/client10",
            rating: 5,
            date: "2024-01-25",
            comment: "Fast, efficient, and innovative. Marcus solved complex challenges with elegant solutions."
          }
        ],
        orders: [
          {
            id: "ORD-90123",
            client: "HealthTech Solutions",
            project: "Fitness Tracking App",
            amount: "$5,250",
            status: "completed",
            date: "2024-02-10"
          },
          {
            id: "ORD-01234",
            client: "Retail Innovations",
            project: "E-commerce Mobile App",
            amount: "$7,800",
            status: "completed",
            date: "2023-11-30"
          }
        ],
        location: "Seattle, WA",
        joinedDate: "2021-10-05",
        languages: ["English", "French"],
        socialProfiles: {
          github: "https://github.com/marcuswilson",
          linkedin: "https://linkedin.com/in/marcuswilson",
          portfolio: "https://marcuswilson.dev"
        }
      }
    ];

    // Insert all freelancers
    const inserted = await Freelancer.insertMany(freelancerData);
    return inserted;
  } catch (error) {
    console.error('Error inserting freelancers:', error);
    throw error;
  }
}

console.log('Starting freelancer data insertion...');