// API Configuration
const API_CONFIG = {
    gecko: {
        name: 'CoinGecko',
        baseURL: 'https://api.coingecko.com/api/v3',
        endpoints: {
            prices: '/simple/price',
            top: '/coins/markets',
            search: '/search',
            coin: '/coins/'
        }
    },
    freecrypto: {
        name: 'Free CryptoAPI',
        baseURL: 'https://api.freecryptoapi.com/v1',
        endpoints: {
            getData: '/getData',
            getTop: '/getTop'
        }
    },
    cmc: {
        name: 'CoinMarketCap',
        baseURL: 'https://pro-api.coinmarketcap.com/v1',
        endpoints: {
            listings: '/cryptocurrency/listings/latest',
            quotes: '/cryptocurrency/quotes/latest'
        },
        apiKey: 'YOUR_CMC_API_KEY' // You need to get this from CoinMarketCap
    }
};

// Global State
let state = {
    currentAPI: 'gecko',
    coinsData: [],
    updateInterval: null
};

// DOM Elements
const elements = {
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    searchType: document.getElementsByName('searchType'),
    pricesGrid: document.getElementById('pricesGrid'),
    coinDetails: document.getElementById('coinDetails'),
    momentumSignals: document.getElementById('momentumSignals'),
    refreshPrices: document.getElementById('refreshPrices'),
    loading: document.getElementById('loading'),
    apiStatus: document.getElementById('apiStatus')
};

// Initialize Application
class CryptoDashboard {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTopPrices();
        this.startAutoRefresh();
        this.testAPIs();
    }

    bindEvents() {
        elements.searchBtn.addEventListener('click', () => this.searchCoin());
        elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchCoin();
        });
        
        elements.searchType.forEach(radio => {
            radio.addEventListener('change', (e) => {
                state.currentAPI = e.target.value;
                this.loadTopPrices();
            });
        });

        elements.refreshPrices.addEventListener('click', () => this.loadTopPrices());
    }

    async testAPIs() {
        const statusElement = elements.apiStatus.querySelector('.status-online');
        try {
            // Test primary API
            const response = await fetch(`${API_CONFIG.gecko.baseURL}/ping`);
            if (response.ok) {
                statusElement.textContent = 'All Systems Online';
                statusElement.style.color = '#10b981';
            }
        } catch (error) {
            statusElement.textContent = 'Some APIs Offline - Using Fallbacks';
            statusElement.style.color = '#f59e0b';
        }
    }

    async loadTopPrices() {
        this.showLoading(true);
        try {
            switch(state.currentAPI) {
                case 'gecko':
                    await this.loadGeckoTopPrices();
                    break;
                case 'freecrypto':
                    await this.loadFreeCryptoTopPrices();
                    break;
                case 'cmc':
                    await this.loadCMCTopPrices();
                    break;
            }
            this.generateMomentumSignals();
        } catch (error) {
            console.error('Error loading prices:', error);
            this.fallbackToGecko();
        } finally {
            this.showLoading(false);
        }
    }

    async loadGeckoTopPrices() {
        const response = await fetch(
            `${API_CONFIG.gecko.baseURL}${API_CONFIG.gecko.endpoints.top}?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h`
        );
        
        if (!response.ok) throw new Error('CoinGecko API failed');
        
        const coins = await response.json();
        this.displayTopPrices(coins);
        state.coinsData = coins;
    }

    async loadFreeCryptoTopPrices() {
        const response = await fetch(
            `${API_CONFIG.freecrypto.baseURL}${API_CONFIG.freecrypto.endpoints.getTop}`
        );
        
        if (!response.ok) throw new Error('Free CryptoAPI failed');
        
        const data = await response.json();
        // Transform data to match our display format
        if (data.data) {
            this.displayTopPrices(data.data.slice(0, 20));
            state.coinsData = data.data;
        }
    }

    async loadCMCTopPrices() {
        // Note: CMC requires an API key in headers
        const response = await fetch(
            `${API_CONFIG.cmc.baseURL}${API_CONFIG.cmc.endpoints.listings}?limit=20`,
            {
                headers: {
                    'X-CMC_PRO_API_KEY': API_CONFIG.cmc.apiKey
                }
            }
        );
        
        if (!response.ok) throw new Error('CoinMarketCap API failed');
        
        const data = await response.json();
        this.displayTopPrices(data.data);
        state.coinsData = data.data;
    }

    displayTopPrices(coins) {
        elements.pricesGrid.innerHTML = coins.map(coin => {
            const price = coin.current_price || coin.price || coin.quote?.USD?.price;
            const change = coin.price_change_percentage_24h || coin.percent_change_24h || coin.quote?.USD?.percent_change_24h;
            const symbol = coin.symbol ? coin.symbol.toUpperCase() : '---';
            
            return `
                <div class="price-card" data-coin-id="${coin.id || coin.symbol}">
                    <div class="coin-header">
                        <img src="${coin.image || 'https://via.placeholder.com/32'}" 
                             alt="${coin.name}" class="coin-icon"
                             onerror="this.src='https://via.placeholder.com/32'">
                        <div>
                            <div class="coin-name">${coin.name}</div>
                            <div class="coin-symbol">${symbol}</div>
                        </div>
                    </div>
                    <div class="coin-price">$${typeof price === 'number' ? price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 6}) : 'N/A'}</div>
                    <div class="coin-change ${change >= 0 ? 'change-positive' : 'change-negative'}">
                        ${typeof change === 'number' ? change.toFixed(2) + '%' : 'N/A'}
                    </div>
                </div>
            `;
        }).join('');
    }

    async searchCoin() {
        const query = elements.searchInput.value.trim();
        if (!query) return;

        this.showLoading(true);
        try {
            let coinData;
            
            switch(state.currentAPI) {
                case 'gecko':
                    coinData = await this.searchGeckoCoin(query);
                    break;
                case 'freecrypto':
                    coinData = await this.searchFreeCryptoCoin(query);
                    break;
            }
            
            if (coinData) {
                this.displayCoinAnalysis(coinData);
            } else {
                elements.coinDetails.innerHTML = '<p class="placeholder">Coin not found. Try a different name or symbol.</p>';
            }
        } catch (error) {
            console.error('Search error:', error);
            elements.coinDetails.innerHTML = '<p class="placeholder">Search failed. Please try again.</p>';
        } finally {
            this.showLoading(false);
        }
    }

    async searchGeckoCoin(query) {
        // First search for the coin
        const searchResponse = await fetch(
            `${API_CONFIG.gecko.baseURL}${API_CONFIG.gecko.endpoints.search}?query=${query}`
        );
        const searchData = await searchResponse.json();
        
        if (!searchData.coins || searchData.coins.length === 0) return null;
        
        const coinId = searchData.coins[0].id;
        
        // Get detailed data
        const detailResponse = await fetch(
            `${API_CONFIG.gecko.baseURL}${API_CONFIG.gecko.endpoints.coin}${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`
        );
        
        return await detailResponse.json();
    }

    displayCoinAnalysis(coinData) {
        const marketData = coinData.market_data;
        const currentPrice = marketData.current_price.usd;
        const priceChange24h = marketData.price_change_percentage_24h;
        const priceChange7d = marketData.price_change_percentage_7d;
        
        // Simple analysis logic
        let analysis = '';
        let recommendation = 'HOLD';
        let confidence = 'Medium';
        
        if (priceChange24h > 10 && priceChange7d > 15) {
            analysis = '🚀 Strong bullish momentum across multiple timeframes';
            recommendation = 'CONSIDER BUYING';
            confidence = 'High';
        } else if (priceChange24h < -8 && priceChange7d < -12) {
            analysis = '📉 Significant downward pressure, high risk';
            recommendation = 'AVOID / SET STOP LOSS';
            confidence = 'High';
        } else if (Math.abs(priceChange24h) < 3) {
            analysis = '↔️ Consolidating, waiting for breakout direction';
            recommendation = 'HOLD / WAIT';
            confidence = 'Medium';
        } else {
            analysis = '📊 Moderate volatility, monitor key levels';
            recommendation = 'HOLD';
            confidence = 'Medium';
        }

        elements.coinDetails.innerHTML = `
            <div class="analysis-item">
                <h4>${coinData.name} (${coinData.symbol.toUpperCase()}) Analysis</h4>
                <p><strong>Current Price:</strong> $${currentPrice.toLocaleString()}</p>
                <p><strong>24h Change:</strong> <span class="${priceChange24h >= 0 ? 'change-positive' : 'change-negative'}">${priceChange24h.toFixed(2)}%</span></p>
                <p><strong>7d Change:</strong> <span class="${priceChange7d >= 0 ? 'change-positive' : 'change-negative'}">${priceChange7d.toFixed(2)}%</span></p>
            </div>
            <div class="analysis-item">
                <h4>Market Analysis</h4>
                <p>${analysis}</p>
                <p><strong>Recommendation:</strong> ${recommendation}</p>
                <p><strong>Confidence:</strong> ${confidence}</p>
            </div>
            <div class="analysis-item">
                <h4>Key Levels</h4>
                <p><strong>Entry Zone:</strong> $${(currentPrice * 0.98).toLocaleString()} - $${(currentPrice * 1.02).toLocaleString()}</p>
                <p><strong>Take Profit:</strong> $${(currentPrice * 1.08).toLocaleString()} (+8%)</p>
                <p><strong>Stop Loss:</strong> $${(currentPrice * 0.94).toLocaleString()} (-6%)</p>
            </div>
        `;
    }

    generateMomentumSignals() {
        if (!state.coinsData.length) return;

        // Simple momentum calculation based on 24h price change
        const signals = state.coinsData
            .filter(coin => {
                const change = coin.price_change_percentage_24h || coin.percent_change_24h || 0;
                return Math.abs(change) > 5; // Only show coins with significant movement
            })
            .sort((a, b) => {
                const changeA = a.price_change_percentage_24h || a.percent_change_24h || 0;
                const changeB = b.price_change_percentage_24h || b.percent_change_24h || 0;
                return Math.abs(changeB) - Math.abs(changeA);
            })
            .slice(0, 5);

        elements.momentumSignals.innerHTML = signals.map(coin => {
            const change = coin.price_change_percentage_24h || coin.percent_change_24h || 0;
            const signalType = change > 0 ? 'signal-buy' : 'signal-sell';
            const signalText = change > 0 ? 'STRONG MOMENTUM' : 'WEAK MOMENTUM';
            
            return `
                <div class="signal-item ${signalType}">
                    <div>
                        <strong>${coin.symbol ? coin.symbol.toUpperCase() : '---'}</strong>
                        <div>${coin.name}</div>
                    </div>
                    <div>
                        <div class="${change >= 0 ? 'change-positive' : 'change-negative'}">${change.toFixed(2)}%</div>
                        <div class="signal-type">${signalText}</div>
                    </div>
                </div>
            `;
        }).join('') || '<p class="placeholder">No strong momentum signals detected in the last 15 minutes.</p>';
    }

    async fallbackToGecko() {
        console.log('Falling back to CoinGecko API');
        state.currentAPI = 'gecko';
        document.querySelector('input[value="gecko"]').checked = true;
        await this.loadGeckoTopPrices();
    }

    startAutoRefresh() {
        // Refresh data every 30 seconds
        state.updateInterval = setInterval(() => {
            this.loadTopPrices();
        }, 30000);
    }

    showLoading(show) {
        elements.loading.classList.toggle('hidden', !show);
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new CryptoDashboard();
});
