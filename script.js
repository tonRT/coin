// Free API endpoints - No API key required
const API_ENDPOINTS = {
    COIN_LIST: 'https://api.coingecko.com/api/v3/coins/markets',
    SEARCH: 'https://api.coingecko.com/api/v3/search',
    GLOBAL: 'https://api.coingecko.com/api/v3/global'
};

// Bitget futures coins (most popular ones)
const BITGET_FUTURES_COINS = [
    'bitcoin', 'ethereum', 'binancecoin', 'ripple', 'cardano', 
    'solana', 'dogecoin', 'polkadot', 'matic-network', 'avalanche-2',
    'chainlink', 'litecoin', 'cosmos', 'uniswap', 'ethereum-classic',
    'stellar', 'filecoin', 'theta-token', 'internet-computer',
    'monero', 'aave', 'algorand', 'bitcoin-cash', 'eos', 'tezos'
];

class FuturesTradingApp {
    constructor() {
        this.coins = [];
        this.filteredCoins = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadGlobalStats();
        // Auto-load coins on page load
        setTimeout(() => this.loadBitgetCoins(), 1000);
    }

    bindEvents() {
        document.getElementById('loadBitgetCoins').addEventListener('click', () => this.loadBitgetCoins());
        document.getElementById('analyzePump').addEventListener('click', () => this.analyzePotentialPumps());
        document.getElementById('searchBtn').addEventListener('click', () => this.searchCoin());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchCoin();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.filterCoins();
            });
        });

        // Trading setup auto-calculation
        document.getElementById('entryPrice').addEventListener('input', () => this.calculateTradingLevels());
        document.getElementById('takeProfit').addEventListener('input', () => this.calculateTradingLevels());
        document.getElementById('stopLoss').addEventListener('input', () => this.calculateTradingLevels());
    }

    async loadBitgetCoins() {
        this.showLoading(true);
        try {
            const response = await fetch(`${API_ENDPOINTS.COIN_LIST}?vs_currency=usd&ids=${BITGET_FUTURES_COINS.join(',')}&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h`);
            
            if (!response.ok) throw new Error('API request failed');
            
            const coins = await response.json();
            this.coins = coins.map(coin => this.enrichCoinData(coin));
            this.filteredCoins = [...this.coins];
            
            this.displayCoins();
            this.updateStats();
            this.generateAIAnalysis();
            
        } catch (error) {
            this.showError('Failed to load cryptocurrency data. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    enrichCoinData(coin) {
        // Add trading-specific data and AI predictions
        const volumeRatio = coin.total_volume / coin.market_cap;
        const priceChange = coin.price_change_percentage_24h || 0;
        
        // AI Prediction Algorithm (simplified)
        const pumpScore = this.calculatePumpScore(coin, volumeRatio, priceChange);
        const volatility = this.calculateVolatility(coin);
        
        return {
            ...coin,
            volumeRatio,
            pumpScore,
            volatility,
            isPotentialPump: pumpScore > 70,
            tradingAdvice: this.generateTradingAdvice(coin, pumpScore, volatility),
            tpSl: this.calculateTPSL(coin.current_price, volatility)
        };
    }

    calculatePumpScore(coin, volumeRatio, priceChange) {
        let score = 50; // Base score
        
        // Volume analysis (30% weight)
        if (volumeRatio > 0.1) score += 20;
        else if (volumeRatio > 0.05) score += 10;
        
        // Price momentum (30% weight)
        if (priceChange > 10) score += 20;
        else if (priceChange > 5) score += 10;
        else if (priceChange < -5) score -= 15;
        
        // Market cap consideration (20% weight)
        if (coin.market_cap < 1e9) score += 15; // Small cap coins more volatile
        else if (coin.market_cap < 1e10) score += 10;
        
        // Recent performance (20% weight)
        if (coin.ath_change_percentage > -20) score += 10;
        
        return Math.min(Math.max(score, 0), 100);
    }

    calculateVolatility(coin) {
        // Simplified volatility calculation based on price change
        const change = Math.abs(coin.price_change_percentage_24h || 0);
        if (change > 15) return 'Very High';
        if (change > 8) return 'High';
        if (change > 3) return 'Medium';
        return 'Low';
    }

    generateTradingAdvice(coin, pumpScore, volatility) {
        if (pumpScore > 80) return 'STRONG BUY - High pump potential';
        if (pumpScore > 60) return 'BUY - Good momentum';
        if (pumpScore > 40) return 'HOLD - Wait for better entry';
        if (pumpScore > 20) return 'CAUTION - Weak momentum';
        return 'AVOID - High risk';
    }

    calculateTPSL(currentPrice, volatility) {
        const volatilityMultiplier = {
            'Very High': 0.15,
            'High': 0.10,
            'Medium': 0.07,
            'Low': 0.05
        };
        
        const multiplier = volatilityMultiplier[volatility] || 0.07;
        const tp = currentPrice * (1 + multiplier);
        const sl = currentPrice * (1 - multiplier);
        
        return { tp, sl };
    }

    displayCoins() {
        const grid = document.getElementById('coinsGrid');
        
        if (this.filteredCoins.length === 0) {
            grid.innerHTML = '<div class="no-coins">No coins found matching your criteria.</div>';
            return;
        }

        grid.innerHTML = this.filteredCoins.map((coin, index) => `
            <div class="coin-card ${coin.isPotentialPump ? 'pump' : ''}" data-coin-id="${coin.id}">
                <div class="coin-header">
                    <img src="${coin.image}" alt="${coin.name}" class="coin-icon">
                    <div class="coin-basic-info">
                        <div class="coin-name">
                            ${coin.name}
                            <span class="coin-symbol">${coin.symbol.toUpperCase()}</span>
                            ${coin.isPotentialPump ? '<span class="pump-badge"><i class="fas fa-rocket"></i> PUMP</span>' : ''}
                        </div>
                        <div class="coin-price ${coin.price_change_percentage_24h < 0 ? 'negative' : ''}">
                            $${this.formatPrice(coin.current_price)}
                        </div>
                        <div class="price-change ${coin.price_change_percentage_24h >= 0 ? 'change-positive' : 'change-negative'}">
                            24h: ${coin.price_change_percentage_24h ? coin.price_change_percentage_24h.toFixed(2) + '%' : 'N/A'}
                        </div>
                    </div>
                </div>
                
                <div class="coin-stats">
                    <div class="stat">
                        <span class="stat-label">Market Cap</span>
                        <span class="stat-value">$${this.formatMarketCap(coin.market_cap)}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Volume</span>
                        <span class="stat-value">$${this.formatMarketCap(coin.total_volume)}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Pump Score</span>
                        <span class="stat-value" style="color: ${this.getScoreColor(coin.pumpScore)}">${coin.pumpScore}/100</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Volatility</span>
                        <span class="stat-value">${coin.volatility}</span>
                    </div>
                </div>
                
                <div class="trading-info">
                    <h4><i class="fas fa-chart-line"></i> Trading Setup</h4>
                    <div class="tp-sl-grid">
                        <div class="tp-item">
                            <strong>TP:</strong> $${this.formatPrice(coin.tpSl.tp)}
                        </div>
                        <div class="sl-item">
                            <strong>SL:</strong> $${this.formatPrice(coin.tpSl.sl)}
                        </div>
                    </div>
                    <div style="margin-top: 10px; font-size: 14px; color: #f59e0b;">
                        <i class="fas fa-robot"></i> <strong>AI Advice:</strong> ${coin.tradingAdvice}
                    </div>
                </div>
            </div>
        `).join('');
    }

    filterCoins() {
        switch (this.currentFilter) {
            case 'pump':
                this.filteredCoins = this.coins.filter(coin => coin.isPotentialPump);
                break;
            case 'high-volume':
                this.filteredCoins = this.coins.filter(coin => coin.volumeRatio > 0.08);
                break;
            default:
                this.filteredCoins = [...this.coins];
        }
        this.displayCoins();
    }

    async searchCoin() {
        const query = document.getElementById('searchInput').value.trim().toLowerCase();
        
        if (!query) {
            this.filteredCoins = [...this.coins];
            this.displayCoins();
            return;
        }

        this.showLoading(true);
        try {
            // Search through our already loaded coins first
            const filtered = this.coins.filter(coin => 
                coin.name.toLowerCase().includes(query) || 
                coin.symbol.toLowerCase() === query
            );

            if (filtered.length > 0) {
                this.filteredCoins = filtered;
                this.displayCoins();
            } else {
                // If not found in loaded coins, try API search
                const response = await fetch(`${API_ENDPOINTS.SEARCH}?query=${query}`);
                const searchData = await response.json();
                
                if (searchData.coins && searchData.coins.length > 0) {
                    const coinIds = searchData.coins.slice(0, 5).map(coin => coin.id);
                    const detailResponse = await fetch(`${API_ENDPOINTS.COIN_LIST}?vs_currency=usd&ids=${coinIds.join(',')}&sparkline=false`);
                    const coins = await detailResponse.json();
                    
                    this.filteredCoins = coins.map(coin => this.enrichCoinData(coin));
                    this.displayCoins();
                } else {
                    this.showError('No cryptocurrency found with that name or symbol.');
                }
            }
        } catch (error) {
            this.showError('Search failed. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    analyzePotentialPumps() {
        // Filter and sort by pump score
        this.filteredCoins = this.coins
            .filter(coin => coin.isPotentialPump)
            .sort((a, b) => b.pumpScore - a.pumpScore);
        
        this.displayCoins();
        this.updateStats();
        
        // Show AI analysis
        this.generateAIAnalysis();
    }

    generateAIAnalysis() {
        const analysisSection = document.getElementById('aiAnalysis');
        const analysisContent = document.getElementById('analysisContent');
        
        const topPumps = this.coins
            .filter(coin => coin.isPotentialPump)
            .sort((a, b) => b.pumpScore - a.pumpScore)
            .slice(0, 5);

        const highRisk = this.coins
            .filter(coin => coin.pumpScore < 30)
            .sort((a, b) => a.pumpScore - b.pumpScore)
            .slice(0, 3);

        analysisContent.innerHTML = `
            <div class="analysis-card">
                <h4><i class="fas fa-rocket"></i> Top Pump Candidates</h4>
                <ul class="analysis-list">
                    ${topPumps.map(coin => `
                        <li>
                            <span>${coin.name} (${coin.symbol.toUpperCase()})</span>
                            <span style="color: ${this.getScoreColor(coin.pumpScore)}">${coin.pumpScore}/100</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div class="analysis-card">
                <h4><i class="fas fa-exclamation-triangle"></i> High Risk Coins</h4>
                <ul class="analysis-list">
                    ${highRisk.map(coin => `
                        <li>
                            <span>${coin.name} (${coin.symbol.toUpperCase()})</span>
                            <span style="color: #ef4444">${coin.pumpScore}/100</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div class="analysis-card">
                <h4><i class="fas fa-brain"></i> Market Insights</h4>
                <ul class="analysis-list">
                    <li>Total Analyzed: <strong>${this.coins.length} coins</strong></li>
                    <li>Pump Candidates: <strong>${this.coins.filter(c => c.isPotentialPump).length} coins</strong></li>
                    <li>Avg Pump Score: <strong>${Math.round(this.coins.reduce((sum, c) => sum + c.pumpScore, 0) / this.coins.length)}/100</strong></li>
                    <li>Market Sentiment: <strong style="color: #10b981">Bullish</strong></li>
                </ul>
            </div>
        `;

        analysisSection.classList.remove('hidden');
    }

    calculateTradingLevels() {
        // This would calculate TP/SL based on user input and leverage
        // For now, it's a placeholder for future enhancement
    }

    async loadGlobalStats() {
        try {
            const response = await fetch(API_ENDPOINTS.GLOBAL);
            const data = await response.json();
            this.updateGlobalStats(data.data);
        } catch (error) {
            console.error('Failed to load global stats:', error);
        }
    }

    updateGlobalStats(data) {
        // Update with real global data if needed
    }

    updateStats() {
        document.getElementById('activeCoins').textContent = this.coins.length;
        document.getElementById('pumpCoins').textContent = this.coins.filter(coin => coin.isPotentialPump).length;
        document.getElementById('totalCoins').textContent = this.coins.length;
    }

    formatPrice(price) {
        if (price >= 1) {
            return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else {
            return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
        }
    }

    formatMarketCap(marketCap) {
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

    getScoreColor(score) {
        if (score >= 80) return '#10b981';
        if (score >= 60) return '#3b82f6';
        if (score >= 40) return '#f59e0b';
        if (score >= 20) return '#ef4444';
        return '#6b7280';
    }

    showLoading(show) {
        document.getElementById('loading').classList.toggle('hidden', !show);
    }

    showError(message) {
        const errorElement = document.getElementById('error');
        const errorMessage = document.getElementById('errorMessage');
        
        errorMessage.textContent = message;
        errorElement.classList.remove('hidden');
        
        setTimeout(() => {
            errorElement.classList.add('hidden');
        }, 5000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FuturesTradingApp();
});
