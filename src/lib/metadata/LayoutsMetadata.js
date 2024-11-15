/**
 * Base metadata that is common across all layouts.
 * 
 * @type {Object}
 * @property {string} author - The author of the content.
 * @property {string} robots - Instructions for web crawlers.
 * @property {Object} twitter - Twitter-specific metadata.
 * @property {string} twitter.card - The type of Twitter card to use.
 * @property {string} twitter.creator - The Twitter handle of the content creator.
 */
const baseMetadata = {
    author: 'Hitmakr',
    robots: 'index, follow',
    twitter: {
        card: 'summary_large_image',
        creator: '@hitmakr',
    },
};

/**
 * Metadata specific to different layouts.
 * 
 * @type {Object}
 * @property {Object}  - Metadata for the  layout.
 * @property {string} .title - The title of the  page.
 * @property {string} .description - The description of the  page.
 * @property {Array<string>} .keywords - Keywords related to the  page.
 * @property {Object} .openGraph - Open Graph metadata for the  page.
 * @property {string} .openGraph.title - The Open Graph title.
 * @property {string} .openGraph.description - The Open Graph description.
 * @property {string} .openGraph.url - The Open Graph URL.
 * @property {string} .openGraph.type - The Open Graph type.
 * @property {Array<Object>} .openGraph.images - Images for Open Graph.
 * @property {string} .openGraph.images.url - The URL of the image.
 * @property {number} .openGraph.images.width - The width of the image.
 * @property {number} .openGraph.images.height - The height of the image.
 * @property {string} .openGraph.images.alt - The alt text for the image.
 * @property {Object} .twitter - Twitter-specific metadata for the  page.
 * @property {string} .twitter.title - The Twitter title.
 * @property {string} .twitter.description - The Twitter description.
 * @property {Array<string>} .twitter.images - Images for Twitter.
 */
const layoutMetadata = {
    home: {
        title: 'Hitmakr',
        description: 'Hitmakr: Explore music on Web3',
        keywords: [
            'web3', 'music', 'nft', 'explore', 'discover', 'decentralized', 
            'blockchain', 'cryptocurrency', 'crypto', 'DeFi', 'dApps', 
            'smart contracts', 'NFTs', 'DAOs', 'metaverse', 'Web 3.0', 
            'distributed ledger technology', 'tokenization', 'crypto trading', 
            'crypto exchange', 'blockchain technology', 'crypto wallet', 
            'blockchain development', 'blockchain security', 'user interface', 
            'UI', 'user experience', 'UX', 'usability', 'accessibility', 
            'intuitive interface', 'user-friendly', 'seamless experience', 
            'web design', 'front-end development', 'Hitmakr', 'music platform', 
            'web3 music', 'blockchain music', 'decentralized music', 
            'music streaming', 'music downloads', 'music NFTs', 'artist platform', 
            'fan engagement', 'music community', 'music discovery', 
            'independent artists', 'emerging artists', 'music creators', 
            'music lovers', 'music fans', 'music industry', 'music technology', 
            'music innovation', 'music revolution', 'digital music', 
            'music ownership', 'music rights', 'music licensing', 
            'music monetization', 'music distribution', 'music collaboration', 
            'music creation', 'music production', 'music promotion', 
            'music marketing', 'music management', 'music education', 
            'music events', 'music concerts', 'music festivals', 
            'music awards', 'music charts', 'music news', 'music reviews', 
            'music blogs', 'music podcasts', 'music videos', 'music games', 
            'music apps', 'music software', 'music hardware', 'music gear', 
            'music instruments', 'music studios', 'music labels', 
            'music publishers', 'music producers', 'music engineers', 
            'music journalists', 'music critics', 'music influencers', 
            'music enthusiasts',
        ],
        openGraph: {
            title: 'Hitmakr: Explore music on Web3',
            description: 'Hitmakr is a revolutionary music platform built on the decentralized power of Web3, transforming the way artists create, share, and monetize their music while empowering fans to connect with their favorite artists in unprecedented ways.',
            url: 'https://hitmakr.io',
            type: 'website',
            images: [
                {
                    url: 'https://gold-select-penguin-939.mypinata.cloud/ipfs/QmUd6cymMiTr7ckHbo3bGumVtELAZiUdJ1Yjj9b718pQWU',
                    width: 1200,
                    height: 630,
                    alt: 'Hitmakr Open Graph Image',
                },
            ],
        },
        twitter: {
            ...baseMetadata.twitter,
            title: 'Hitmakr: Explore music on Web3',
            description: 'Hitmakr is a revolutionary music platform built on the decentralized power of Web3, transforming the way artists create, share, and monetize their music while empowering fans to connect with their favorite artists in unprecedented ways.',
            images: [
                'https://gold-select-penguin-939.mypinata.cloud/ipfs/QmUd6cymMiTr7ckHbo3bGumVtELAZiUdJ1Yjj9b718pQWU',
            ],
        },
    },
    auth: {
        title: 'Hitmakr Authentication',
        description: 'Secure Web3 Wallet Authentication and SIWE Sign-In for Hitmakr',
        keywords: [
            'web3', 'authentication', 'SIWE', 'Ethereum', 'sign-in', 'wallet integration',
            'blockchain', 'cryptocurrency', 'crypto', 'DeFi', 'dApps', 'smart contracts',
            'Web 3.0', 'distributed ledger technology', 'tokenization', 'crypto wallet',
            'blockchain security', 'user interface', 'UI', 'user experience', 'UX',
            'usability', 'accessibility', 'intuitive interface', 'user-friendly',
            'seamless experience', 'Hitmakr', 'music platform', 'web3 music',
            'blockchain music', 'decentralized music', 'artist platform',
            'fan engagement', 'music community', 'music discovery', 'independent artists',
            'emerging artists', 'music creators', 'music lovers', 'music fans',
            'music industry', 'music technology', 'music innovation', 'digital music',
            'music ownership', 'music rights', 'music licensing', 'music monetization',
            'secure login', 'decentralized identity', 'self-sovereign identity',
            'cryptographic signatures', 'blockchain authentication', 'web3 security',
            'digital signatures', 'non-custodial login', 'passwordless authentication',
            'EIP-4361', 'ERC-1271', 'MetaMask', 'WalletConnect', 'Coinbase Wallet',
            'Trust Wallet', 'Ledger', 'Trezor', 'hardware wallet integration',
            'multi-chain support', 'cross-chain authentication', 'NFT-based authentication',
            'token-gated access', 'social recovery', 'two-factor authentication (2FA)',
            'biometric authentication', 'key management', 'private key security'
        ],
        openGraph: {
            title: 'Hitmakr Authentication: Secure Web3 Wallet Sign-In',
            description: 'Experience seamless and secure Web3 wallet authentication and SIWE sign-in on Hitmakr. Connect your crypto wallet to access a revolutionary music platform built on the decentralized power of Web3.',
            url: 'https://hitmakr.io/auth',
            type: 'website',
            images: [
                {
                    url: 'https://gold-select-penguin-939.mypinata.cloud/ipfs/QmUd6cymMiTr7ckHbo3bGumVtELAZiUdJ1Yjj9b718pQWU', // Replace with actual auth image hash
                    width: 1200,
                    height: 630,
                    alt: 'Hitmakr Authentication Open Graph Image',
                },
            ],
        },
        twitter: {
            ...baseMetadata.twitter,
            title: 'Hitmakr Authentication: Secure Web3 Wallet Sign-In',
            description: 'Connect your crypto wallet for secure access to @hitmakrr, the revolutionary Web3 music platform. Experience decentralized authentication and unlock a new world of music creation and discovery.',
            images: [
                'https://gold-select-penguin-939.mypinata.cloud/ipfs/QmUd6cymMiTr7ckHbo3bGumVtELAZiUdJ1Yjj9b718pQWU', // Replace with actual auth image hash
            ],
        },
    },
    creatives: {
        title: 'Hitmakr Creatives: Empowering Artists & Labels',
        description: 'Hitmakr: A platform for artists, music labels, and independent content creators to thrive in the decentralized music space.',
        keywords: [
            'web3', 'music', 'NFTs', 'independent artists', 'music labels', 
            'music creators', 'content creators', 'blockchain', 'decentralized music', 
            'music industry', 'artist platform', 'fan engagement', 'music ownership', 
            'music rights', 'music monetization', 'music distribution', 
            'collaborative music creation', 'music production', 'music promotion', 
            'music marketing', 'music labels', 'creative independence', 
            'artist revenue streams', 'fan support', 'music streaming', 'music NFTs', 
            'direct artist-to-fan engagement', 'decentralized platforms', 
            'digital ownership', 'crypto for artists', 'music contracts', 
            'creator economy', 'creator tools', 'fan funding', 'crowdsourcing for artists',
            'music technology', 'independent music production', 'indie artists', 
            'record labels', 'artistic control', 'creator-first platform', 
            'music collaboration', 'artist growth', 'music innovation', 
            'blockchain music', 'music creators hub', 'Hitmakr Creatives'
        ],
        openGraph: {
            title: 'Hitmakr Creatives: Empowering Artists & Labels',
            description: 'Hitmakr is a Web3 music platform that empowers artists, music labels, and independent content creators to take control of their music, monetize their work, and connect with fans directly through the power of decentralization.',
            url: 'https://hitmakr.io/creatives',
            type: 'website',
            images: [
                {
                    url: 'https://gold-select-penguin-939.mypinata.cloud/ipfs/QmUd6cymMiTr7ckHbo3bGumVtELAZiUdJ1Yjj9b718pQWU',
                    width: 1200,
                    height: 630,
                    alt: 'Hitmakr Creatives Open Graph Image',
                },
            ],
        },
        twitter: {
            ...baseMetadata.twitter,
            title: 'Hitmakr Creatives: Empowering Artists & Labels',
            description: 'Hitmakr provides a revolutionary platform for artists, music labels, and independent creators to thrive, monetize, and connect with their audience on Web3.',
            images: [
                'https://gold-select-penguin-939.mypinata.cloud/ipfs/QmUd6cymMiTr7ckHbo3bGumVtELAZiUdJ1Yjj9b718pQWU',
            ],
        },
    },
    profiles: {
        title: 'Your Hitmakr Profile - Manage Your Music Journey',
        description: 'Manage your music, connect with fans, and explore the world of Web3 music on your personalized Hitmakr profile.',
        keywords: [
            'Hitmakr profile', 'music profile', 'web3 music', 'artist dashboard',
            'music management', 'fan engagement', 'music analytics', 'music earnings',
            'content creation', 'music settings', 'profile customization', 
            'music uploads', 'playlist creation', 'music community', 'artist bio', 
            'social media links', 'music releases', 'NFT music', 'music marketplace'
        ],
        openGraph: {
            title: 'Your Hitmakr Profile: Music, Fans, and Web3',
            description: 'Your Hitmakr profile is your gateway to a decentralized music experience. Manage your music, engage with fans, and explore the future of music creation.',
            url: 'https://hitmakr.io/profile', // Dynamically generate with actual username 
            type: 'profile',
            images: [
                {
                    url: 'https://gold-select-penguin-939.mypinata.cloud/ipfs/QmUd6cymMiTr7ckHbo3bGumVtELAZiUdJ1Yjj9b718pQWU', // Use a default image or make it dynamic based on user profile
                    width: 1200,
                    height: 630,
                    alt: 'Hitmakr Profile Open Graph Image',
                },
            ],
        },
        twitter: {
            ...baseMetadata.twitter,
            title: 'Check out my Hitmakr profile!', 
            description: 'Join me on Hitmakr, the Web3 platform for music lovers and creators. Explore my latest releases, connect, and discover the future of music.', //  Dynamically generate with username
            images: [
                'https://gold-select-penguin-939.mypinata.cloud/ipfs/QmUd6cymMiTr7ckHbo3bGumVtELAZiUdJ1Yjj9b718pQWU', // Use a default image or make it dynamic based on user profile
            ],
        },
    },
    browse: {
        title: 'Explore Music on Hitmakr | Discover New Artists & Tracks',
        description: 'Discover a world of music on Hitmakr. Explore genres, search for your favorite artists, and find your next favorite song in the Web3 music space.',
        keywords: [
            'web3 music', 'music discovery', 'explore music', 'music search',
            'new music', 'emerging artists', 'independent music', 'music genres',
            'music streaming', 'music downloads', 'music NFTs', 'blockchain music',
            'decentralized music', 'music community', 'music lovers', 'music fans',
            'music exploration', 'find music', 'search music', 'music curation',
            'personalized music', 'music recommendations', 'music charts',
            'trending music', 'top songs', 'new releases', 'music playlists',
            'music browsing', 'music platform', 'Hitmakr', 'Web3', 'blockchain',
            'crypto', 'NFT', 'decentralized', 'digital music', 'music innovation'
        ],
        openGraph: {
            title: 'Explore the Future of Music | Hitmakr Music Discovery',
            description: 'Dive into a diverse collection of music on Hitmakr, a Web3 platform where you can discover new artists, explore genres, and experience the future of music.',
            url: 'https://hitmakr.io/browse',
            type: 'website',
            images: [
                {
                    url: 'https://gold-select-penguin-939.mypinata.cloud/ipfs/QmUd6cymMiTr7ckHbo3bGumVtELAZiUdJ1Yjj9b718pQWU', // Consider a browse-specific image
                    width: 1200,
                    height: 630,
                    alt: 'Hitmakr Browse Open Graph Image',
                },
            ],
        },
        twitter: {
            ...baseMetadata.twitter,
            title: 'Discover New Music on Hitmakr 🚀',
            description: 'Explore a universe of sounds on Hitmakr, the Web3 music platform. Find your next favorite artist and dive into the future of music.',
            images: [
                'https://gold-select-penguin-939.mypinata.cloud/ipfs/QmUd6cymMiTr7ckHbo3bGumVtELAZiUdJ1Yjj9b718pQWU', // Consider a browse-specific image
            ],
        },
    },
};


/**
 * Retrieves metadata for a given layout.
 *
 * This function merges base metadata with specific layout metadata.
 * If the specified layout does not exist in layoutMetadata, it defaults to '' layout metadata.
 *
 * @param {string} layout - The layout for which metadata is to be retrieved.
 * @returns {Object} The combined metadata for the specified layout.
 */
export const getMetadata = (layout) => ({
    ...baseMetadata,
    ...(layoutMetadata[layout] || layoutMetadata['']),
});
