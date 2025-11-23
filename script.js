// Free API from CoinGecko - No API key required for basic data
const API_BASE_URL = 'https://api.coingecko.com/api/v3';

// DOM Elements
const coinsGrid = document.getElementById('coinsGrid');
const loadTopCoinsBtn = document.getElementById('loadTopCoins');
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const loadingIndicator = document.getElementById('loadingIndicator');

// Load top cryptocurrencies on button click
loadTopCoinsBtn.addEventListener('click', () => {
    fetchTopCoins();
});

// Search for a specific cryptocurrency
searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        searchCoin(query);
    } else {
        alert('Please enter a cryptocurrency name or symbol to search.');
    }
});

// Allow pressing 'Enter' to search
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

// Fetches top coins by market cap
async function fetchTopCoins() {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=30&page=1&sparkline=false`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const coins = await response.json();
        displayCoins(coins);
    } catch (error) {
        console.error('Error fetching top coins:', error);
        alert('Failed to load cryptocurrency data. Please try again later.');
    } finally {
        showLoading(false);
    }
}

// Searches for a specific coin
async function searchCoin(query) {
    showLoading(true);
    try {
        // First, get list of all coins to find the correct ID
        const allCoinsResponse = await fetch(`${API_BASE_URL}/coins/list`);
        const allCoins = await allCoinsResponse.json();
        
        // Find coin by name or symbol (case-insensitive)
        const foundCoin = allCoins.find(coin => 
            coin.name.toLowerCase().includes(query.toLowerCase()) || 
            coin.symbol.toLowerCase() === query.toLowerCase()
        );
        
        if (foundCoin) {
            // Fetch detailed data for the found coin
            const detailResponse = await fetch(`${API_BASE_URL}/coins/markets?vs_currency=usd&ids=${foundCoin.id}&sparkline=false`);
            const coinData = await detailResponse.json();
            displayCoins(coinData);
        } else {
            coinsGrid.innerHTML = '<p class="no-results">No cryptocurrency found with that name or symbol.</p>';
        }
    } catch (error) {
        console.error('Error searching for coin:', error);
        alert('Search failed. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Displays coins in the grid
function displayCoins(coins) {
    if (!coins || coins.length === 0) {
        coinsGrid.innerHTML = '<p class="no-results">No results found.</p>';
        return;
    }

    coinsGrid.innerHTML = coins.map(coin => `
        <div class="coin-card">
            <div class="coin-header">
                <img src="${coin.image}" alt="${coin.name}" class="coin-icon">
                <div class="coin-name-symbol">
                    <div class="coin-name">${coin.name}</div>
                    <div class="coin-symbol">${coin.symbol.toUpperCase()}</div>
                </div>
            </div>
            <div class="coin-price">$${formatNumber(coin.current_price)}</div>
            <div class="coin-change ${coin.price_change_percentage_24h >= 0 ? 'change-positive' : 'change-negative'}">
                24h: ${coin.price_change_percentage_24h ? coin.price_change_percentage_24h.toFixed(2) + '%' : 'N/A'}
            </div>
            <div class="coin-market-cap">
                Market Cap: $${formatMarketCap(coin.market_cap)}
            </div>
        </div>
    `).join('');
}

// Helper function to format large numbers
function formatNumber(num) {
    if (num >= 1) {
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
        return num.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
    }
}

// Helper function to format market cap
function formatMarketCap(marketCap) {
    if (marketCap >= 1e12) {
        return (marketCap / 1e12).toFixed(2) + 'T';
    } else if (marketCap >= 1e9) {
        return (marketCap / 1e9).toFixed(2) + 'B';
    } else if (marketCap >= 1e6) {
        return (marketCap / 1e6).toFixed(2) + 'M';
    } else {
        return marketCap.toLocaleString();
    }
}

// Show/hide loading indicator
function showLoading(show) {
    loadingIndicator.classList.toggle('hidden', !show);
}
