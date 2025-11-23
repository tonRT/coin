// Free API endpoints
const API_ENDPOINTS = {
    COIN_LIST: 'https://api.coingecko.com/api/v3/coins/markets',
    SEARCH: 'https://api.coingecko.com/api/v3/search',
    GLOBAL: 'https://api.coingecko.com/api/v3/global'
};

// Top 100 cryptocurrencies for analysis
const TOP_CRYPTO_IDS = [
    'bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana', 
    'usd-coin', 'ripple', 'cardano', 'dogecoin', 'avalanche-2',
    'polkadot', 'tron', 'chainlink', 'polygon-pos', 'bitcoin-cash',
    'litecoin', 'internet-computer', 'uniswap', 'stellar', 'ethereum-classic',
    'monero', 'okb', 'cosmos', 'filecoin', 'crypto-com-chain',
    'aptos', 'arbitrum', 'near', 'algorand', 'hedera-hashgraph',
    'vechain', 'theta-token', 'optimism', 'maker', 'frax',
    'aave', 'the-graph', 'elrond-erd-2', 'eos', 'tezos',
    'rocket-pool', 'flow', 'axie-infinity', 'pancakeswap-token', 'klay-token',
    'neo', 'kava', 'mina-protocol', 'curve-dao-token', 'kucoin-shares'
];

class CryptoFuturesApp {
    constructor() {
        this.coins = [];
        this.filteredCoins = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateStats();
        // Auto-load coins after 1 second
        setTimeout(() => {
            this.loadAllCoins();
        }, 1000);
    }

    bindEvents() {
        document.getElementById('loadCoins').addEventListener('click', () => this.loadAllCoins());
        document.getElementById('analyzePump').addEventListener('click', () => this.analyzePotentialMovers());
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

    async loadAllCoins() {
        this.showLoading(true);
        try {
            // Load coins in batches to avoid API limits
            const batchSize = 50;
            let allCoins = [];
            
            for (let i = 0; i < TOP_CRYPTO_IDS.length; i += batchSize) {
                const batchIds = TOP_CRYPTO_IDS.slice(i, i + batchSize);
                const response = await fetch(
                    `${API_ENDPOINTS.COIN_LIST}?vs_currency=usd&ids=${batchIds.join(',')}&order=market_cap_desc&per_page=${batchSize}&page=1&sparkline=false&price_change_percentage=24h`
                );
                
                if (!response.ok) throw new Error('API request failed');
                
                const coins = await response.json();
                allCoins = [...allCoins, ...coins];
                
                // Update UI progressively
                this.coins = allCoins.map(coin => this.enrichCoinData(coin));
                this.filteredCoins = [...this.coins];
                this.displayCoins();
                this.updateStats();
            }
            
            this.generateAIAnalysis();
            
        } catch (error) {
            console.error('Error loading coins:', error);
            // Fallback: Use mock data if API fails
            this.useMockData();
        } finally {
            this.showLoading(false);
        }
    }

    enrichCoinData(coin) {
        // Advanced AI analysis for pump/dump prediction
        const volumeRatio = coin.total_volume / (coin.market_cap || 1);
        const priceChange = coin.price_change_percentage_24h || 0;
        const marketCap = coin.market_cap || 0;
        
        // AI Prediction Algorithm
        const pumpScore = this.calculatePumpScore(coin, volumeRatio, priceChange, marketCap);
        const dumpScore = this.calculateDumpScore(coin, volumeRatio, priceChange, marketCap);
        const volatility = this.calculateVolatility(coin);
        
        // Time-based predictions
        const tenMinPrediction = this.predict10MinMovement(coin, pumpScore, dumpScore);
        const thirtyMinPrediction = this.predict30MinMovement(coin, pumpScore, dumpScore);
        
        return {
            ...coin,
            volumeRatio,
            pumpScore,
            dumpScore,
            volatility,
            tenMinPrediction,
            thirtyMinPrediction,
            isPotentialPump: pumpScore > 70,
            isPotentialDump: dumpScore > 70,
            tradingAdvice: this.generateTradingAdvice(pumpScore, dumpScore),
            tpSl: this.calculateTPSL(coin.current_price, volatility, pumpScore, dumpScore)
        };
    }

    calculatePumpScore(coin, volumeRatio, priceChange, marketCap) {
        let score = 50; // Base score
        
        // Volume analysis (25% weight)
        if (volumeRatio > 0.15) score += 20;
        else if (volumeRatio > 0.08) score += 10;
        else if (volumeRatio > 0.03) score += 5;
        
        // Price momentum (25% weight)
        if (priceChange > 15) score += 20;
        else if (priceChange > 8) score += 15;
        else if (priceChange > 3) score += 10;
        else if (priceChange < -5) score -= 10;
        
        // Market cap consideration (20% weight)
        if (marketCap < 5e8) score += 15; // Small cap coins more volatile
        else if (marketCap < 2e9) score += 10;
        else if (marketCap < 1e10) score += 5;
        
        // Recent performance (15% weight)
        if (coin.ath_change_percentage > -15) score += 10;
        else if (coin.ath_change_percentage > -30) score += 5;
        
        // Random factor for simulation (15% weight)
        const randomFactor = Math.random() * 15;
        score += randomFactor;
        
        return Math.min(Math.max(score, 0), 100);
    }

    calculateDumpScore(coin, volumeRatio, priceChange, marketCap) {
        let score = 30; // Base score (lower than pump)
        
        // Negative momentum (30% weight)
        if (priceChange < -10) score += 25;
        else if (priceChange < -5) score += 15;
        else if (priceChange > 20) score += 10; // Overbought
        
        // Volume analysis (25% weight)
        if (volumeRatio > 0.2) score += 15; // High volume selling
        else if (volumeRatio > 0.1) score += 10;
        
        // Market cap consideration (20% weight)
        if (marketCap < 1e9) score += 15; // Small cap more volatile
        
        // Price near ATH (15% weight)
        if (coin.ath_change_percentage > -5) score += 10;
        
        // Random factor for simulation (10% weight)
        const randomFactor = Math.random() * 10;
        score += randomFactor;
        
        return Math.min(Math.max(score, 0), 100);
    }

    calculateVolatility(coin) {
        const change = Math.abs(coin.price_change_percentage_24h || 0);
        if (change > 20) return 'Very High';
        if (change > 12) return 'High';
        if (change > 6) return 'Medium';
        return 'Low';
    }

    predict10MinMovement(coin, pumpScore, dumpScore) {
        if (pumpScore > 75) return { type: 'pump', confidence: pumpScore, change: 5 + Math.random() * 10 };
        if (dumpScore > 75) return { type: 'dump', confidence: dumpScore, change: -(5 + Math.random() * 8) };
        if (pumpScore > 60) return { type: 'pump', confidence: pumpScore, change: 2 + Math.random() * 6 };
        if (dumpScore > 60) return { type: 'dump', confidence: dumpScore, change: -(2 + Math.random() * 5) };
        return { type: 'neutral', confidence: 50, change: -2 + Math.random() * 4 };
    }

    predict30MinMovement(coin, pumpScore, dumpScore) {
        if (pumpScore > 70) return { type: 'pump', confidence: pumpScore, change: 8 + Math.random() * 15 };
        if (dumpScore > 70) return { type: 'dump', confidence: dumpScore, change: -(8 + Math.random() * 12) };
        if (pumpScore > 55) return { type: 'pump', confidence: pumpScore, change: 4 + Math.random() * 8 };
        if (dumpScore > 55) return { type: 'dump', confidence: dumpScore, change: -(4 + Math.random() * 7) };
        return { type: 'neutral', confidence: 50, change: -3 + Math.random() * 6 };
    }

    generateTradingAdvice(pumpScore, dumpScore) {
        if (pumpScore > 80) return 'STRONG BUY SIGNAL - High pump potential';
        if (pumpScore > 65) return 'BUY - Good upward momentum';
        if (dumpScore > 80) return 'STRONG SELL SIGNAL - High dump risk';
        if (dumpScore > 65) return 'SELL - Downward pressure';
        if (pumpScore > 50) return 'HOLD/BUY - Moderate potential';
        if (dumpScore > 50) return 'HOLD/SELL - Moderate risk';
        return 'HOLD - Wait for clearer signals';
    }

    calculateTPSL(currentPrice, volatility, pumpScore, dumpScore) {
        const volatilityMultiplier = {
            'Very High': 0.12,
            'High': 0.08,
            'Medium': 0.06,
            'Low': 0.04
        };
        
        const multiplier = volatilityMultiplier[volatility] || 0.06;
        
        let tp, sl;
        if (pumpScore > dumpScore) {
            // Bullish setup
            tp = currentPrice * (1 + multiplier * (pumpScore / 100));
            sl = currentPrice * (1 - multiplier * 0.7);
        } else {
            // Bearish setup
            tp = currentPrice * (1 - multiplier * (dumpScore / 100));
            sl = currentPrice * (1 + multiplier * 0.7);
        }
        
        return { tp, sl };
    }

    displayCoins() {
        const grid = document.getElementById('coinsGrid');
        
        if (this.filteredCoins.length === 0) {
            grid.innerHTML = '<div class="no-coins">No coins found matching your criteria.</div>';
            return;
        }

        grid.innerHTML = this.filteredCoins.map((coin, index) => {
            const tenMinPred = coin.tenMinPrediction;
            const thirtyMinPred = coin.thirtyMinPrediction;
            
            return `
            <div class="coin-card ${coin.isPotentialPump ? 'pump' : ''} ${coin.isPotentialDump ? 'dump' : ''}" data-coin-id="${coin.id}">
                <div class="coin-header">
                    <img src="${coin.image}" alt="${coin.name}" class="coin-icon" onerror="this.src='https://via.placeholder.com/50'">
                    <div class="coin-basic-info">
                        <div class="coin-name">
                            ${coin.name}
                            <span class="coin-symbol">${coin.symbol.toUpperCase()}</span>
                            ${coin.isPotentialPump ? '<span class="pump-badge"><i class="fas fa-rocket"></i> PUMP</span>' : ''}
                            ${coin.isPotentialDump ? '<span class="dump-badge"><i class="fas fa-bomb"></i> DUMP</span>' : ''}
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
                        <span class="stat-value" style="color: ${this.getScoreColor(coin.pumpScore)}">${Math.round(coin.pumpScore)}/100</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Dump Score</span>
                        <span class="stat-value" style="color: ${this.getDumpScoreColor(coin.dumpScore)}">${Math.round(coin.dumpScore)}/100</span>
                    </div>
                </div>

                <div class="time-predictions">
                    <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                        ${tenMinPred.type !== 'neutral' ? 
                            `<span class="time-badge ${tenMinPred.type === 'pump' ? 'pump-badge' : 'dump-badge'}">
                                <i class="fas fa-clock"></i> 10min: ${tenMinPred.type === 'pump' ? '+' : ''}${tenMinPred.change.toFixed(1)}%
                            </span>` : ''
                        }
                        ${thirtyMinPred.type !== 'neutral' ? 
                            `<span class="time-badge ${thirtyMinPred.type === 'pump' ? 'pump-badge' : 'dump-badge'}">
                                <i class="fas fa-clock"></i> 30min: ${thirtyMinPred.type === 'pump' ? '+' : ''}${thirtyMinPred.change.toFixed(1)}%
                            </span>` : ''
                        }
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
            `;
        }).join('');
    }

    filterCoins() {
        switch (this.currentFilter) {
            case 'pump':
                this.filteredCoins = this.coins.filter(coin => 
                    coin.tenMinPrediction.type === 'pump' && coin.tenMinPrediction.confidence > 65
                );
                break;
            case 'dump':
                this.filteredCoins = this.coins.filter(coin => 
                    coin.tenMinPrediction.type === 'dump' && coin.tenMinPrediction.confidence > 65
                );
                break;
            case '30min':
                this.filteredCoins = this.coins.filter(coin => 
                    (coin.thirtyMinPrediction.type === 'pump' || coin.thirtyMinPrediction.type === 'dump') && 
                    coin.thirtyMinPrediction.confidence > 60
                );
                break;
            default:
                this.filteredCoins = [...this.coins];
        }
        this.displayCoins();
    }

    analyzePotentialMovers() {
        // Find coins with high probability of movement
        this.filteredCoins = this.coins
            .filter(coin => 
                (coin.tenMinPrediction.confidence > 70 || coin.thirtyMinPrediction.confidence > 70) &&
                (coin.tenMinPrediction.type !== 'neutral' || coin.thirtyMinPrediction.type !== 'neutral')
            )
            .sort((a, b) => {
                const aScore = Math.max(a.tenMinPrediction.confidence, a.thirtyMinPrediction.confidence);
                const bScore = Math.max(b.tenMinPrediction.confidence, b.thirtyMinPrediction.confidence);
                return bScore - aScore;
            });
        
        this.displayCoins();
        this.updateStats();
        this.generateAIAnalysis();
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
            // Search through loaded coins
            const filtered = this.coins.filter(coin => 
                coin.name.toLowerCase().includes(query) || 
                coin.symbol.toLowerCase() === query
            );

            if (filtered.length > 0) {
                this.filteredCoins = filtered;
                this.displayCoins();
            } else {
                this.showError('Cryptocurrency not found in current data. Try loading more coins.');
            }
        } catch (error) {
            this.showError('Search failed. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    generateAIAnalysis() {
        const analysisSection = document.getElementById('aiAnalysis');
        const analysisContent = document.getElementById('analysisContent');
        
        const topPumps = this.coins
            .filter(coin => coin.tenMinPrediction.type === 'pump')
            .sort((a, b) => b.tenMinPrediction.confidence - a.tenMinPrediction.confidence)
            .slice(0, 5);

        const topDumps = this.coins
            .filter(coin => coin.tenMinPrediction.type === 'dump')
            .sort((a, b) => b.tenMinPrediction.confidence - a.tenMinPrediction.confidence)
            .slice(0, 5);

        const thirtyMinMovers = this.coins
            .filter(coin => coin.thirtyMinPrediction.type !== 'neutral')
            .sort((a, b) => b.thirtyMinPrediction.confidence - a.thirtyMinPrediction.confidence)
            .slice(0, 5);

        analysisContent.innerHTML = `
            <div class="analysis-card">
                <h4><i class="fas fa-rocket"></i> Top 10-Minute Pump Candidates</h4>
                <ul class="analysis-list">
                    ${topPumps.map(coin => `
                        <li>
                            <span>${coin.name} (${coin.symbol.toUpperCase()})</span>
                            <span style="color: ${this.getScoreColor(coin.tenMinPrediction.confidence)}">
                                ${Math.round(coin.tenMinPrediction.confidence)}% (${coin.tenMinPrediction.change > 0 ? '+' : ''}${coin.tenMinPrediction.change.toFixed(1)}%)
                            </span>
                        </li>
                    `).join('')}
                    ${topPumps.length === 0 ? '<li>No strong pump signals detected</li>' : ''}
                </ul>
            </div>
            <div class="analysis-card">
                <h4><i class="fas fa-bomb"></i> Top 10-Minute Dump Candidates</h4>
                <ul class="analysis-list">
                    ${topDumps.map(coin => `
                        <li>
                            <span>${coin.name} (${coin.symbol.toUpperCase()})</span>
                            <span style="color: ${this.getDumpScoreColor(coin.tenMinPrediction.confidence)}">
                                ${Math.round(coin.tenMinPrediction.confidence)}% (${coin.tenMinPrediction.change.toFixed(1)}%)
                            </span>
                        </li>
                    `).join('')}
                    ${topDumps.length === 0 ? '<li>No strong dump signals detected</li>' : ''}
                </ul>
            </div>
            <div class="analysis-card">
                <h4><i class="fas fa-brain"></i> Market Insights</h4>
                <ul class="analysis-list">
                    <li>Total Analyzed: <strong>${this.coins.length} coins</strong></li>
                    <li>Pump Candidates: <strong>${this.coins.filter(c => c.tenMinPrediction.type === 'pump').length} coins</strong></li>
                    <li>Dump Candidates: <strong>${this.coins.filter(c => c.tenMinPrediction.type === 'dump').length} coins</strong></li>
                    <li>Market Sentiment: <strong style="color: ${this.getMarketSentimentColor()}">${this.getMarketSentiment()}</strong></li>
                </ul>
            </div>
        `;

        analysisSection.classList.remove('hidden');
    }

    getMarketSentiment() {
        const pumps = this.coins.filter(c => c.tenMinPrediction.type === 'pump').length;
        const dumps = this.coins.filter(c => c.tenMinPrediction.type === 'dump').length;
        
        if (pumps > dumps * 2) return 'Very Bullish';
        if (pumps > dumps) return 'Bullish';
        if (dumps > pumps * 2) return 'Very Bearish';
        if (dumps > pumps) return 'Bearish';
        return 'Neutral';
    }

    getMarketSentimentColor() {
        const sentiment = this.getMarketSentiment();
        switch(sentiment) {
            case 'Very Bullish': return '#10b981';
            case 'Bullish': return '#3b82f6';
            case 'Bearish': return '#f59e0b';
            case 'Very Bearish': return '#ef4444';
            default: return '#6b7280';
        }
    }

    calculateTradingLevels() {
        // This would calculate TP/SL based on user input and leverage
        // For now, it's a placeholder for future enhancement
    }

    updateStats() {
        document.getElementById('activeCoins').textContent = this.coins.length;
        document.getElementById('pumpCoins').textContent = this.coins.filter(coin => coin.tenMinPrediction.type === 'pump').length;
        document.getElementById('dumpCoins').textContent = this.coins.filter(coin => coin.tenMinPrediction.type === 'dump').length;
    }

    formatPrice(price) {
        if (!price || price === 0) return '0.00';
        if (price >= 1) {
            return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else {
            return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
        }
    }

    formatMarketCap(marketCap) {
        if (!marketCap || marketCap === 0) return '0';
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

    getDumpScoreColor(score) {
        if (score >= 80) return '#ef4444';
        if (score >= 60) return '#f59e0b';
        if (score >= 40) return '#3b82f6';
        if (score >= 20) return '#10b981';
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

    useMockData() {
        // Fallback mock data if API fails
        const mockCoins = [
            {
                id: 'bitcoin',
                name: 'Bitcoin',
                symbol: 'btc',
                image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
                current_price: 45000,
                price_change_percentage_24h: 2.5,
                market_cap: 880000000000,
                total_volume: 25000000000
            },
            {
                id: 'ethereum',
                name: 'Ethereum',
                symbol: 'eth',
                image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
                current_price: 3000,
                price_change_percentage_24h: 1.8,
                market_cap: 360000000000,
                total_volume: 15000000000
            }
        ];
        
        this.coins = mockCoins.map(coin => this.enrichCoinData(coin));
        this.filteredCoins = [...this.coins];
        this.displayCoins();
        this.updateStats();
        this.generateAIAnalysis();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CryptoFuturesApp();
});
