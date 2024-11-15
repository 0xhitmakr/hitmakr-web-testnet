export const contentDatabase = {
    'about': {
        title: 'About Hitmakr',
        lastUpdated: '2024-01-15',
        category: 'Company',
        author: 'Hitmakr Team',
        content: [
            {
                type: 'introduction',
                heading: 'Welcome to Hitmakr',
                text: 'Welcome to Hitmakr – where music creation, rights, and revenue are reimagined for the Web3 world. Hitmakr is a decentralized platform built for artists, producers, and music lovers who want full creative control over their work. We believe in a world where creators own their music, can collaborate seamlessly, and generate real, tangible value from their sound.'
            },
            {
                type: 'section',
                heading: 'Our Mission',
                text: "Hitmakr's mission is to put creators first. In an industry where ownership and revenue distribution can be complicated, we simplify the process. By using decentralized tech, we provide transparent, direct channels for creators to split earnings, manage rights, and grow their audiences without the usual gatekeepers."
            },
            {
                type: 'features',
                heading: 'Why Hitmakr?',
                text: 'With Hitmakr, the future of music ownership is finally in your hands. We offer:',
                list: [
                    {
                        title: 'Direct Revenue Splits',
                        description: 'Easily split revenue with collaborators—artists, producers, even managers—in real-time, using our innovative wallet-sharing feature.'
                    },
                    {
                        title: 'Music Rights on the Blockchain',
                        description: 'Our decentralized registry makes it easy for you to manage and prove ownership, secure copyrights, and protect your work.'
                    },
                    {
                        title: 'Exclusive Content Options',
                        description: 'Choose to release tracks to the public or share exclusive, subscriber-only content, creating unique experiences for your fans.'
                    }
                ]
            },
            {
                type: 'section',
                heading: 'Our Vision',
                text: "Hitmakr isn't just a platform—it's a movement to empower artists in a digital-first world. We're dedicated to pushing boundaries, creating new possibilities for revenue, and fostering a community of artists who value authenticity, innovation, and artistic freedom."
            }
        ]
    },

    'careers': {
        title: 'Careers at Hitmakr',
        lastUpdated: '2024-01-15',
        category: 'Company',
        author: 'Hitmakr HR Team',
        content: [
            {
                type: 'introduction',
                heading: 'Join Our Team',
                text: "Hitmakr is on a mission to transform the music industry by putting power back in the hands of creators. We're building a platform that redefines music ownership, revenue, and creative freedom for artists, producers, and fans worldwide. Although we've just launched and aren't currently hiring, we're always looking ahead—and we want to connect with talented people who share our vision."
            },
            {
                type: 'section',
                heading: 'Stay Connected',
                text: "Even if we don't have open roles at the moment, we encourage you to follow us on X (formerly Twitter) and keep an eye on our social channels. We'll post updates about future opportunities as our team grows."
            },
            {
                type: 'conclusion',
                text: 'In the meantime, welcome to the revolution!'
            }
        ]
    },

    getContent(slug) {
        return this[slug] || null;
    },

    getContentByCategory(category) {
        return Object.entries(this)
            .filter(([key, content]) => 
                typeof content === 'object' && 
                content.category === category)
            .map(([slug, content]) => ({
                slug,
                ...content
            }));
    },

    getRecentContent(limit = 5) {
        return Object.entries(this)
            .filter(([key, content]) => typeof content === 'object' && content.lastUpdated)
            .sort((a, b) => new Date(b[1].lastUpdated) - new Date(a[1].lastUpdated))
            .slice(0, limit)
            .map(([slug, content]) => ({
                slug,
                ...content
            }));
    },

    searchContent(query) {
        const searchQuery = query.toLowerCase();
        return Object.entries(this)
            .filter(([key, content]) => {
                if (typeof content !== 'object') return false;
                const searchableText = `${content.title} ${JSON.stringify(content.content)}`.toLowerCase();
                return searchableText.includes(searchQuery);
            })
            .map(([slug, content]) => ({
                slug,
                ...content
            }));
    }
};

export default contentDatabase;