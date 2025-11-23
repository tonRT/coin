// Free Crypto API Configuration
const API_CONFIG = {
    baseURL: 'https://api.coingecko.com/api/v3',
    endpoints: {
        markets: '/coins/markets',
        global: '/global'
    }
};

// Global State
let state = {
    coins: [],
    lastUpdate: null,
    updateInterval: null
};

// DOM Elements
const elements = {
    refreshData: document.getElementById('refreshData'),
    apiStatus: document.getElementById('apiStatus'),
    pumpCoins: document.getElementById('pumpCoins'),
    dumpCoins: document.getElementById('dumpCoins'),
    tradingAnalysis: document.getElementById('tradingAnalysis'),
    lastUpdated: document.getElementById('lastUpdated'),
    coinsTracked: document.getElementById('coinsTracked'),
    marketSentiment: document.getElementById('marketSentiment')
};

// Initialize Application
class CryptoAnalyzer {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadMarketData();
        this.startAutoRefresh();
    }

    bindEvents() {
        elements.refreshData.addEventListener('click', () => this.loadMarketData());
    }

    async loadMarketData() {
        elements.apiStatus.textContent = 'Fetching...';
        elements.apiStatus.style.color = '#f59e0b';

        try {
            // Fetch top 100 coins by market cap from CoinGecko
            const response = await fetch(
                `${API_CONFIG.baseURL}${API_CONFIG.endpoints.markets}?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`
            );
            
            if (!response.ok) throw new Error('API request failed');
            
            const coins = await response.json();
            state.coins = coins;
            state.lastUpdate = new Date();
            
            this.updateDisplay();
            elements.apiStatus.textContent = 'Live';
            elements.apiStatus.style.color = '#10b981';
            
        } catch (error) {
            console.error('Error loading market data:', error);
            elements.apiStatus.textContent = 'Failed';
            elements.apiStatus.style.color = '#ef4444';
            this.showError('Failed to load market data. Please try again.');
        }
    }

    updateDisplay() {
        this.updateTopMovers();
        this.updateTradingAnalysis();
        this.updateStats();
    }

    updateTopMovers() {
        if (!state.coins.length) return;

        // Sort by 24h price change
        const sortedCoins = [...state.coins].sort((a, b) => 
            (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)
        );

        // Get top 5 pumps and dumps
        const topPumps = sortedCoins.slice(0, 5);
        const topDumps = sortedCoins.slice(-5).reverse();

        // Display pump coins
        elements.pumpCoins.innerHTML = topPumps.map(coin => this.createCoinItem(coin)).join('');

        // Display dump coins
        elements.dumpCoins.innerHTML = topDumps.map(coin => this.createCoinItem(coin)).join('');
    }

    createCoinItem(coin) {
        const change = coin.price_change_percentage_24h;
        const changeClass = change >= 0 ? 'change-positive' : 'change-negative';
        const changeSymbol = change >= 0 ? '+' : '';
        
        return `
            <div class="coin-item">
                <div class="coin-info">
                    <img src="${coin.image}" alt="${coin.name}" class="coin-icon" 
                         onerror="this.src='https://via.placeholder.com/32'">
                    <div>
                        <div class="coin-name">${coin.name}</div>
                        <div class="coin-symbol">${coin.symbol.toUpperCase()}</div>
                    </div>
                </div>
                <div class="coin-details">
                    <div class="coin-price">$${coin.current_price.toLocaleString()}</div>
                    <div class="coin-change ${changeClass}">
                        ${changeSymbol}${change ? change.toFixed(2) : '0.00'}%
                    </div>
                </div>
            </div>
        `;
    }

    updateTradingAnalysis() {
        if (!state.coins.length) return;

        const topPumps = [...state.coins]
            .sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))
            .slice(0, 3);

        const analysisHTML = topPumps.map(coin => {
            const prediction = this.generatePrediction(coin);
            return `
                <div class="analysis-item ${prediction.signal === 'BUY' ? 'signal-buy' : 'signal-sell'}">
                    <h3>${coin.name} (${coin.symbol.toUpperCase()})</h3>
                    <p><strong>Current Price:</strong> $${coin.current_price.toLocaleString()}</p>
                    <p><strong>24h Change:</strong> <span class="${coin.price_change_percentage_24h >= 0 ? 'change-positive' : 'change-negative'}">
                        ${coin.price_change_percentage_24h >= 0 ? '+' : ''}${coin.price_change_percentage_24h ? coin.price_change_percentage_24h.toFixed(2) : '0.00'}%
                    </span></p>
                    <p><strong>Momentum Analysis:</strong> ${prediction.analysis}</p>
                    <p><strong>Next Move Prediction:</strong> ${prediction.nextMove}</p>
                    
                    <div class="trading-setup">
                        <div class="setup-item">
                            <div class="setup-label">Auto Entry</div>
                            <div class="setup-value">$${(coin.current_price * 1.002).toFixed(4)}</div>
                        </div>
                        <div class="setup-item">
                            <div class="setup-label">Take Profit</div>
                            <div class="setup-value">$${(coin.current_price * (1 + prediction.targetPercent / 100)).toFixed(4)}</div>
                        </div>
                        <div class="setup-item">
                            <div class="setup-label">Stop Loss</div>
                            <div class="setup-value">$${(coin.current_price * 0.98).toFixed(4)}</div>
                        </div>
                        <div class="setup-item">
                            <div class="setup-label">Risk Level</div>
                            <div class="setup-value" style="color: #ef4444">20%</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        elements.tradingAnalysis.innerHTML = analysisHTML;
    }

    generatePrediction(coin) {
        const change = coin.price_change_percentage_24h || 0;
        const volume = coin.total_volume || 0;
        const marketCap = coin.market_cap || 0;
        
        // Simple AI prediction logic based on price change and volume
        let signal, analysis, nextMove, targetPercent;
        
        if (change > 15 && volume > 1000000) {
            signal = 'BUY';
            analysis = '🚀 Strong bullish momentum with high volume. Pump likely to continue.';
            nextMove = 'Expected 5-15% pump in next 2-4 hours';
            targetPercent = 8 + Math.random() * 7;
        } else if (change > 8) {
            signal = 'BUY';
            analysis = '📈 Moderate bullish trend. Good entry for short-term gains.';
            nextMove = 'Expected 3-8% movement in next 4-6 hours';
            targetPercent = 4 + Math.random() * 4;
        } else if (change < -10) {
            signal = 'SELL';
            analysis = '📉 Heavy dumping detected. High risk of further decline.';
            nextMove = 'Possible 5-12% further drop';
            targetPercent = - (8 + Math.random() * 4);
        } else {
            signal = 'HOLD';
            analysis = '⚡ Consolidating phase. Wait for clearer direction.';
            nextMove = 'Sideways movement expected';
            targetPercent = 1 + Math.random() * 2;
        }

        return { signal, analysis, nextMove, targetPercent: targetPercent.toFixed(1) };
    }

    updateStats() {
        elements.lastUpdated.textContent = state.lastUpdate.toLocaleTimeString();
        elements.coinsTracked.textContent = state.coins.length;
        
        // Calculate market sentiment
        const positiveCoins = state.coins.filter(coin => (coin.price_change_percentage_24h || 0) > 0).length;
        const sentimentPercent = (positiveCoins / state.coins.length) * 100;
        
        let sentiment = 'Neutral';
        if (sentimentPercent > 60) sentiment = 'Bullish 🟢';
        if (sentimentPercent < 40) sentiment = 'Bearish 🔴';
        
        elements.marketSentiment.textContent = sentiment;
    }

    startAutoRefresh() {
        // Refresh data every 2 minutes
        state.updateInterval = setInterval(() => {
            this.loadMarketData();
        }, 120000);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            background: #ef4444;
            color: white;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: center;
        `;
        errorDiv.textContent = message;
        
        elements.tradingAnalysis.innerHTML = '';
        elements.tradingAnalysis.appendChild(errorDiv);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CryptoAnalyzer();
});
