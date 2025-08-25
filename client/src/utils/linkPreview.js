// Link Preview Utility
export const extractUrls = (text) => {
  if (!text || typeof text !== 'string') {
    return [];
  }
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

export const generateLinkPreview = async (url) => {
  try {
    // Extract domain and create a basic preview
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // Enhanced mock previews with better images and descriptions
    const mockPreviews = {
      'github.com': {
        title: 'GitHub Repository',
        description: 'Discover, explore, and collaborate on code repositories with the world\'s largest community of developers.',
        image: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
        domain: domain,
        favicon: 'https://github.com/favicon.ico'
      },
      'linkedin.com': {
        title: 'LinkedIn Professional Network',
        description: 'Connect with professionals, build your network, and advance your career on the world\'s largest professional platform.',
        image: 'https://content.linkedin.com/content/dam/me/business/en-us/amp/brand-site/v2/bg/LI-Bug.svg.original.svg',
        domain: domain,
        favicon: 'https://static.licdn.com/sc/h/al2o9zrvru7aqj8e1x2rzsrca'
      },
      'twitter.com': {
        title: 'Twitter / X',
        description: 'Join the conversation and stay connected with what\'s happening around the world.',
        image: 'https://abs.twimg.com/responsive-web/client-web/icon-ios.77d25eba.png',
        domain: domain,
        favicon: 'https://abs.twimg.com/favicons/twitter.2.ico'
      },
      'x.com': {
        title: 'X (formerly Twitter)',
        description: 'Join the conversation and stay connected with what\'s happening around the world.',
        image: 'https://abs.twimg.com/responsive-web/client-web/icon-ios.77d25eba.png',
        domain: domain,
        favicon: 'https://abs.twimg.com/favicons/twitter.2.ico'
      },
      'youtube.com': {
        title: 'YouTube Video',
        description: 'Watch, share, and discover videos from creators around the world on YouTube.',
        image: 'https://www.youtube.com/img/desktop/yt_1200.png',
        domain: domain,
        favicon: 'https://www.youtube.com/s/desktop/f506bd45/img/favicon_32x32.png'
      },
      'youtu.be': {
        title: 'YouTube Video',
        description: 'Watch, share, and discover videos from creators around the world on YouTube.',
        image: 'https://www.youtube.com/img/desktop/yt_1200.png',
        domain: 'youtube.com',
        favicon: 'https://www.youtube.com/s/desktop/f506bd45/img/favicon_32x32.png'
      },
      'medium.com': {
        title: 'Medium Article',
        description: 'Read and discover stories, thinking, and expertise from writers on any topic.',
        image: 'https://miro.medium.com/1*m-R_BkNf1Qjr1YbyOIJY2w.png',
        domain: domain,
        favicon: 'https://medium.com/favicon.ico'
      },
      'facebook.com': {
        title: 'Facebook',
        description: 'Connect with friends and the world around you on Facebook.',
        image: 'https://static.xx.fbcdn.net/rsrc.php/v3/y5/r/TaXiYNQOyB0.png',
        domain: domain,
        favicon: 'https://static.xx.fbcdn.net/rsrc.php/yo/r/iRmz9lCMBD2.ico'
      },
      'instagram.com': {
        title: 'Instagram',
        description: 'Share photos and videos with friends and discover content from accounts you love.',
        image: 'https://static.cdninstagram.com/rsrc.php/v3/yz/r/VdhSTnUA_R6.png',
        domain: domain,
        favicon: 'https://static.cdninstagram.com/rsrc.php/v3/yI/r/VsNE-OHk_8a.ico'
      },
      'stackoverflow.com': {
        title: 'Stack Overflow',
        description: 'Get answers to your programming questions and help others with their code.',
        image: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/apple-touch-icon@2.png',
        domain: domain,
        favicon: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/favicon.ico'
      },
      'reddit.com': {
        title: 'Reddit',
        description: 'Dive into anything. Reddit is a network of communities where people can dive into their interests.',
        image: 'https://www.redditstatic.com/shreddit/assets/reddit-logo-large.png',
        domain: domain,
        favicon: 'https://www.redditstatic.com/shreddit/assets/favicon/32x32.png'
      },
      'news.ycombinator.com': {
        title: 'Hacker News',
        description: 'A social news website focusing on computer science and entrepreneurship.',
        image: 'https://news.ycombinator.com/favicon.ico',
        domain: domain,
        favicon: 'https://news.ycombinator.com/favicon.ico'
      },
      'dev.to': {
        title: 'DEV Community',
        description: 'A constructive and inclusive social network for software developers.',
        image: 'https://dev-to-uploads.s3.amazonaws.com/uploads/logos/resized_logo_UQww2soKuUsjaOGNB38o.png',
        domain: domain,
        favicon: 'https://dev.to/favicon.ico'
      },
      'codepen.io': {
        title: 'CodePen',
        description: 'An online community for testing and showcasing user-created HTML, CSS and JavaScript code snippets.',
        image: 'https://cpwebassets.codepen.io/assets/favicon/apple-touch-icon-5ae1a0698dcc2402e9712f7d01ed509a57814f994c660df9f7a952f3060705ee.png',
        domain: domain,
        favicon: 'https://cpwebassets.codepen.io/assets/favicon/favicon-aec34940fbc1a6e787974dcd360f2c6b63348d4b1f4e06c77743096d55480f33.ico'
      },
      'dribbble.com': {
        title: 'Dribbble',
        description: 'Discover the world\'s top designers & creatives. Dribbble is the leading destination to find & showcase creative work.',
        image: 'https://cdn.dribbble.com/assets/dribbble-ball-mark-2bd45f09c2fb58dbbfb44766d5d1d07c5a12972d602ef8b32204d28fa3dda554.svg',
        domain: domain,
        favicon: 'https://cdn.dribbble.com/assets/favicon-b9c0306cb52897b0f7f10c1ba79b4fe7d09a1a0a5de4652c4ae5aae3faf8df83.ico'
      },
      'behance.net': {
        title: 'Behance',
        description: 'Showcase and discover creative work on the world\'s leading online platform for creative industries.',
        image: 'https://a5.behance.net/2af0a0b68947b761de9ee9b6a854aea1d9635472/img/site/behance_black.svg',
        domain: domain,
        favicon: 'https://www.behance.net/favicon.ico'
      },
      'figma.com': {
        title: 'Figma',
        description: 'Figma is a collaborative web application for interface design, with additional offline features.',
        image: 'https://static.figma.com/app/icon/1/favicon.svg',
        domain: domain,
        favicon: 'https://static.figma.com/app/icon/1/favicon.ico'
      }
    };

    // Check for specific domain previews
    for (const [domainKey, preview] of Object.entries(mockPreviews)) {
      if (domain.includes(domainKey)) {
        return {
          url,
          ...preview
        };
      }
    }

    // Default preview for unknown domains
    return {
      url,
      title: `Link - ${domain}`,
      description: `Visit ${domain} for more information.`,
      image: null,
      domain: domain
    };

  } catch (error) {
    console.error('Error generating link preview:', error);
    return null;
  }
};

// Enhanced link preview function that could use a real API service
export const fetchLinkPreview = async (url) => {
  try {
    // In production, you would use a service like:
    // - LinkPreview API
    // - Embedly
    // - Microlink
    // - Or implement your own server-side scraper
    
    // For now, use the mock generator
    return await generateLinkPreview(url);
  } catch (error) {
    console.error('Error fetching link preview:', error);
    return null;
  }
};
