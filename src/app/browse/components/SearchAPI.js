
const API_BASE_URL = process.env.NEXT_PUBLIC_HITMAKR_SERVER;


const searchContent = async (searchTerm = '', filters = {}, page = 1, limit = 20) => {
    try {
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });

        if (searchTerm) {
            queryParams.append('title', searchTerm);
        }

        const metadataFilters = {};

        if (filters.type) {
            metadataFilters.type = filters.type;
        }

        if (filters.genre) {
            metadataFilters.attributes = [{
                trait_type: "Genre",
                value: filters.genre
            }];
        }

        if (Object.keys(metadataFilters).length > 0) {
            queryParams.append('metadata', JSON.stringify(metadataFilters));
        }

        if (filters.chainId) {
            queryParams.append('chainId', filters.chainId);
        }

        if (filters.walletAddress) {
            queryParams.append('walletAddress', filters.walletAddress);
        }

        if (filters.sortBy) {
            queryParams.append('sortBy', filters.sortBy);
            queryParams.append('sortOrder', filters.sortOrder || 'desc');
        }

        let endpoint = '/song/search';

        if (filters.walletAddress && !searchTerm && !filters.type && !filters.genre) {
            endpoint = `/song/wallet/${filters.walletAddress}`;
        } else if (filters.chainId && !searchTerm && !filters.type && !filters.genre) {
            endpoint = `/song/chain/${filters.chainId}`;
        } else if (!searchTerm && !filters.type && !filters.genre && !filters.chainId && !filters.walletAddress) {
            endpoint = '/song/recent';
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}?${queryParams}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch content: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error in searchContent:', error);
        throw error;
    }
};


export const getContentByCategory = async (category, page = 1, limit = 20) => {
    const categoryTypes = {
        'songs': 'single',
        'sounds': 'sound',
        'loops': 'loop'
    };

    return searchContent('', { type: categoryTypes[category.toLowerCase()] }, page, limit);
};


export const getContentByGenre = async (genre, page = 1, limit = 20) => {
    return searchContent('', { genre }, page, limit);
};


export const searchByTerm = async (term, page = 1, limit = 20) => {
    return searchContent(term, {}, page, limit);
};

export const getRecentContent = async (page = 1, limit = 20) => {
    return searchContent('', {}, page, limit);
};

export const searchApi = {
    searchContent,
    getContentByCategory,
    getContentByGenre,
    searchByTerm,
    getRecentContent
};