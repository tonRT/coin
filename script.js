// Configuration
const CONFIG = {
    TELEGRAM_BOT_TOKEN: '8221231743:AAGW30HpqUPaf656q60mmboQQ-x2NnLHub8',
    TELEGRAM_CHAT_ID: '7417215529', // You need to set this
    UPDATE_INTERVAL: 7000, // 7 seconds
    BITGET_COINS: [
        'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'AVAX', 'DOT', 'LINK', 'MATIC',
        'DOGE', 'LTC', 'ATOM', 'ETC', 'XLM', 'FIL', 'APT', 'ARB', 'NEAR', 'OP'
    ]
};

// Global State
let state = {
    isBotRunning: false,
    coinsData: [],
    analysisInterval: null,
    telegramAlerts: new Set(),
    chart: null
};

// DOM Elements
const elements = {
    startBot: document.getElementById('startBot'),
    stopBot: document.getElementById('stopBot'),
    botStatus: document.getElementById('botStatus'),
    telegramStatus: document.getElementById('telegramStatus'),
    marketStatus: document.getElementById('marketStatus'),
    totalCoins: document.getElementById('totalCoins'),
    activeSignals: document.getElementById('activeSignals'),
    marketSentiment: document.getElementById('marketSentiment'),
    topPumps: document.getElementById('topPumps'),
    topDumps: document.getElementById('topDumps'),
    analysisGrid: document.getElementById('analysisGrid'),
    activityLog: document.getElementById('activityLog'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    priceChart: document.getElementById('priceChart')
};

// Initialize Application
class CryptoTrader {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadInitialData();
        this.initializeChart();
        this.logActivity('System initialized. Ready to start trading bot.');
    }

    bindEvents() {
        elements.startBot.addEventListener('click', () => this.startBot());
        elements.stopBot.addEventListener('click', () => this.stopBot());
        document.getElementById('refreshAnalysis').addEventListener('click', () => this.refreshAnalysis());
        document.getElementById('timeFrame').addEventListener('change', (e) => this.updateTimeFrame(e.target.value));
    }

    async loadInitialData() {
        elements.loadingOverlay.classList.remove('hidden');
        
        try {
            // Simulate API calls with mock data
            await this.loadMarketData();
            await this.generateAnalysis();
            
            setTimeout(() => {
                elements.loadingOverlay.classList.add('hidden');
                this.logActivity('Market data loaded successfully. Analysis ready.');
            }, 2000);
            
        } catch (error) {
            console.error('Error loading data:', error);
            elements.loadingOverlay.classList.add('hidden');
            this.logActivity('Error loading market data. Using simulated data.', 'error');
        }
    }

    async loadMarketData() {
        // Simulate API call to get market data
        return new Promise((resolve) => {
            setTimeout(() => {
                state.coinsData = this.generateMockMarketData();
                resolve();
            }, 1500);
        });
    }

    generateMockMarketData() {
        const coins = [];
        const symbols = CONFIG.BITGET_COINS;
        
        symbols.forEach(symbol => {
            const basePrice = this.getBasePrice(symbol);
            const priceChange = (Math.random() - 0.5) * 20; // -10% to +10%
            const currentPrice = basePrice * (1 + priceChange / 100);
            const volume = basePrice * (1000000 + Math.random() * 5000000);
            
            coins.push({
                symbol,
                name: this.getCoinName(symbol),
                price: currentPrice,
                change24h: priceChange,
                volume,
                marketCap: basePrice * (10000000 + Math.random() * 50000000),
                prediction: this.generatePrediction(symbol, currentPrice)
            });
        });
        
        return coins;
    }

    getBasePrice(symbol) {
        const basePrices = {
            'BTC': 45000, 'ETH': 3000, 'BNB': 600, 'SOL': 100, 'XRP': 0.6,
            'ADA': 0.5, 'AVAX': 40, 'DOT': 7, 'LINK': 15, 'MATIC': 1,
            'DOGE': 0.15, 'LTC': 70, 'ATOM': 10, 'ETC': 30, 'XLM': 0.12,
            'FIL': 5, 'APT': 8, 'ARB': 1.5, 'NEAR': 3, 'OP': 2.5
        };
        return basePrices[symbol] || 10;
    }

    getCoinName(symbol) {
        const names = {
            'BTC': 'Bitcoin', 'ETH': 'Ethereum', 'BNB': 'Binance Coin', 
            'SOL': 'Solana', 'XRP': 'Ripple', 'ADA': 'Cardano',
            'AVAX': 'Avalanche', 'DOT': 'Polkadot', 'LINK': 'Chainlink',
            'MATIC': 'Polygon', 'DOGE': 'Dogecoin', 'LTC': 'Litecoin',
            'ATOM': 'Cosmos', 'ETC': 'Ethereum Classic', 'XLM': 'Stellar',
            'FIL': 'Filecoin', 'APT': 'Aptos', 'ARB': 'Arbitrum',
            'NEAR': 'Near Protocol', 'OP': 'Optimism'
        };
        return names[symbol] || symbol;
    }

    generatePrediction(symbol, currentPrice) {
        const types = ['pump', 'dump', 'neutral'];
        const type = types[Math.floor(Math.random() * 3)];
        const confidence = Math.floor(Math.random() * 40) + 60; // 60-100%
        const change = type === 'pump' ? 
            (Math.random() * 15) + 10 : // 10-25% pump
            type === 'dump' ? 
            -(Math.random() * 15) - 10 : // -10 to -25% dump
            (Math.random() * 4) - 2; // -2 to +2% neutral
        
        return {
            type,
            confidence,
            change,
            timeframe: '10m',
            risk: Math.floor(Math.random() * 30) + 10 // 10-40% risk
        };
    }

    generateAnalysis() {
        // Update statistics
        elements.totalCoins.textContent = state.coinsData.length;
        const activeSignals = state.coinsData.filter(coin => 
            coin.prediction.confidence > 70 && coin.prediction.type !== 'neutral'
        ).length;
        elements.activeSignals.textContent = activeSignals;

        // Update market sentiment
        const pumps = state.coinsData.filter(coin => coin.prediction.type === 'pump').length;
        const dumps = state.coinsData.filter(coin => coin.prediction.type === 'dump').length;
        const sentiment = pumps > dumps ? 'BULLISH' : pumps < dumps ? 'BEARISH' : 'NEUTRAL';
        elements.marketSentiment.textContent = sentiment;
        elements.marketSentiment.className = `metric-value sentiment-${sentiment.toLowerCase()}`;

        // Update top movers
        this.updateTopMovers();
        
        // Update analysis grid
        this.updateAnalysisGrid();
        
        // Update risk analysis
        this.updateRiskAnalysis();
        
        // Update technical indicators
        this.updateTechnicalIndicators();
    }

    updateTopMovers() {
        const topPumps = [...state.coinsData]
            .filter(coin => coin.prediction.type === 'pump')
            .sort((a, b) => b.prediction.confidence - a.prediction.confidence)
            .slice(0, 5);

        const topDumps = [...state.coinsData]
            .filter(coin => coin.prediction.type === 'dump')
            .sort((a, b) => b.prediction.confidence - a.prediction.confidence)
            .slice(0, 5);

        elements.topPumps.innerHTML = topPumps.map(coin => `
            <div class="mover-item">
                <img src="https://cryptologos.cc/logos/${coin.name.toLowerCase().replace(' ', '-')}-${coin.symbol.toLowerCase()}-logo.png" 
                     alt="${coin.name}" class="mover-icon" onerror="this.src='https://via.placeholder.com/32'">
                <div class="mover-info">
                    <div class="mover-name">${coin.name}</div>
                    <div class="mover-symbol">${coin.symbol}</div>
                </div>
                <div class="mover-price">$${coin.price.toFixed(2)}</div>
                <div class="mover-change positive">+${coin.prediction.change.toFixed(1)}%</div>
            </div>
        `).join('');

        elements.topDumps.innerHTML = topDumps.map(coin => `
            <div class="mover-item">
                <img src="https://cryptologos.cc/logos/${coin.name.toLowerCase().replace(' ', '-')}-${coin.symbol.toLowerCase()}-logo.png" 
                     alt="${coin.name}" class="mover-icon" onerror="this.src='https://via.placeholder.com/32'">
                <div class="mover-info">
                    <div class="mover-name">${coin.name}</div>
                    <div class="mover-symbol">${coin.symbol}</div>
                </div>
                <div class="mover-price">$${coin.price.toFixed(2)}</div>
                <div class="mover-change negative">${coin.prediction.change.toFixed(1)}%</div>
            </div>
        `).join('');
    }

    updateAnalysisGrid() {
        const highConfidenceCoins = state.coinsData
            .filter(coin => coin.prediction.confidence > 70 && coin.prediction.type !== 'neutral')
            .sort((a, b) => b.prediction.confidence - a.prediction.confidence);

        elements.analysisGrid.innerHTML = highConfidenceCoins.map(coin => {
            const prediction = coin.prediction;
            const riskClass = prediction.risk < 20 ? 'low' : prediction.risk < 30 ? 'medium' : 'high';
            
            return `
                <div class="analysis-card ${prediction.type}">
                    <div class="coin-header">
                        <img src="https://cryptologos.cc/logos/${coin.name.toLowerCase().replace(' ', '-')}-${coin.symbol.toLowerCase()}-logo.png" 
                             alt="${coin.name}" class="coin-icon" onerror="this.src='https://via.placeholder.com/40'">
                        <div class="coin-info">
                            <div class="coin-name">${coin.name}</div>
                            <div class="coin-symbol">${coin.symbol}</div>
                        </div>
                        <div class="prediction-badge badge-${prediction.type}">
                            ${prediction.type.toUpperCase()}
                        </div>
                    </div>
                    
                    <div class="prediction-info">
                        <div class="prediction-text">
                            Predicted ${prediction.type} of <strong>${Math.abs(prediction.change).toFixed(1)}%</strong> in 10 minutes
                        </div>
                        <div class="confidence-meter">
                            <div class="confidence-fill confidence-${prediction.confidence > 80 ? 'high' : prediction.confidence > 70 ? 'medium' : 'low'}" 
                                 style="width: ${prediction.confidence}%"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
                            <span>Confidence: ${prediction.confidence}%</span>
                            <span class="risk-${riskClass}">Risk: ${prediction.risk}%</span>
                        </div>
                    </div>
                    
                    <div class="trading-setup">
                        <div class="setup-grid">
                            <div class="setup-item">
                                <div class="setup-label">Entry</div>
                                <div class="setup-value">$${coin.price.toFixed(4)}</div>
                            </div>
                            <div class="setup-item">
                                <div class="setup-label">TP</div>
                                <div class="setup-value">$${(coin.price * (1 + Math.abs(prediction.change) / 100)).toFixed(4)}</div>
                            </div>
                            <div class="setup-item">
                                <div class="setup-label">SL</div>
                                <div class="setup-value">$${(coin.price * (1 - Math.abs(prediction.change) / 200)).toFixed(4)}</div>
                            </div>
                            <div class="setup-item">
                                <div class="setup-label">Leverage</div>
                                <div class="setup-value">10x</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateRiskAnalysis() {
        const totalRisk = state.coinsData.reduce((sum, coin) => sum + coin.prediction.risk, 0) / state.coinsData.length;
        const marketRisk = Math.min(100, totalRisk * 1.5);
        const volatilityRisk = Math.min(100, totalRisk * 0.8);

        document.getElementById('marketRisk').style.width = `${marketRisk}%`;
        document.getElementById('marketRiskValue').textContent = `${Math.round(marketRisk)}%`;
        document.getElementById('volatilityRisk').style.width = `${volatilityRisk}%`;
        document.getElementById('volatilityRiskValue').textContent = `${Math.round(volatilityRisk)}%`;

        // Update risk meter colors
        document.getElementById('marketRisk').className = `meter-fill ${marketRisk < 33 ? 'low' : marketRisk < 66 ? 'medium' : 'high'}`;
        document.getElementById('volatilityRisk').className = `meter-fill ${volatilityRisk < 33 ? 'low' : volatilityRisk < 66 ? 'medium' : 'high'}`;
    }

    updateTechnicalIndicators() {
        // Simulate technical indicator values
        document.getElementById('rsiValue').textContent = Math.floor(Math.random() * 30) + 35;
        document.getElementById('volumeValue').textContent = (Math.random() * 1000).toFixed(0) + 'M';
        document.getElementById('emaValue').textContent = (Math.random() * 1000).toFixed(2);
    }

    initializeChart() {
        const ctx = elements.priceChart.getContext('2d');
        state.chart = new Chart(ctx, {
            type: 'candlestick',
            data: {
                datasets: [{
                    label: 'BTC/USDT',
                    data: this.generateChartData(),
                    color: {
                        up: '#10b981',
                        down: '#ef4444',
                        unchanged: '#6b7280',
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'minute'
                        }
                    },
                    y: {
                        position: 'right'
                    }
                }
            }
        });
    }

    generateChartData() {
        const data = [];
        let price = 45000;
        const now = new Date();
        
        for (let i = 0; i < 50; i++) {
            const time = new Date(now - (50 - i) * 60000);
            const open = price;
            const change = (Math.random() - 0.5) * 200;
            const close = price + change;
            const high = Math.max(open, close) + Math.random() * 100;
            const low = Math.min(open, close) - Math.random() * 100;
            
            data.push({
                x: time,
                o: open,
                h: high,
                l: low,
                c: close
            });
            
            price = close;
        }
        
        return data;
    }

    startBot() {
        state.isBotRunning = true;
        elements.startBot.classList.add('hidden');
        elements.stopBot.classList.remove('hidden');
        elements.botStatus.innerHTML = '<i class="fas fa-circle" style="color: #10b981"></i> Bot Running';
        
        this.logActivity('Trading bot started. Monitoring for 30%+ moves...');
        
        // Start analysis interval
        state.analysisInterval = setInterval(() => {
            this.updateMarketData();
            this.checkForAlerts();
        }, CONFIG.UPDATE_INTERVAL);
        
        elements.telegramStatus.textContent = 'Telegram: Active - Monitoring';
    }

    stopBot() {
        state.isBotRunning = false;
        elements.startBot.classList.remove('hidden');
        elements.stopBot.classList.add('hidden');
        elements.botStatus.innerHTML = '<i class="fas fa-circle" style="color: #ef4444"></i> Bot Stopped';
        
        if (state.analysisInterval) {
            clearInterval(state.analysisInterval);
            state.analysisInterval = null;
        }
        
        this.logActivity('Trading bot stopped.');
        elements.telegramStatus.textContent = 'Telegram: Ready';
    }

    updateMarketData() {
        // Simulate market data updates
        state.coinsData.forEach(coin => {
            const change = (Math.random() - 0.5) * 4; // -2% to +2%
            coin.price = coin.price * (1 + change / 100);
            coin.prediction = this.generatePrediction(coin.symbol, coin.price);
        });
        
        this.generateAnalysis();
        this.updateChart();
        
        elements.marketStatus.textContent = `Last update: ${new Date().toLocaleTimeString()}`;
    }

    updateChart() {
        if (state.chart) {
            const newData = this.generateChartData();
            state.chart.data.datasets[0].data = newData;
            state.chart.update('none');
        }
    }

    checkForAlerts() {
        const strongMoves = state.coinsData.filter(coin => 
            Math.abs(coin.prediction.change) >= 30 && 
            coin.prediction.confidence >= 80 &&
            !state.telegramAlerts.has(coin.symbol)
        );

        strongMoves.forEach(coin => {
            this.sendTelegramAlert(coin);
            state.telegramAlerts.add(coin.symbol);
            
            // Remove from alerts after 1 hour
            setTimeout(() => {
                state.telegramAlerts.delete(coin.symbol);
            }, 3600000);
        });
    }

    async sendTelegramAlert(coin) {
        const message = this.formatTelegramMessage(coin);
        this.logActivity(`Telegram Alert: ${coin.symbol} ${coin.prediction.type.toUpperCase()} signal detected`);
        
        // In a real implementation, you would send this to Telegram
        console.log('Telegram Alert:', message);
        
        // Simulate API call
        try {
            // await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({
            //         chat_id: CONFIG.TELEGRAM_CHAT_ID,
            //         text: message,
            //         parse_mode: 'HTML'
            //     })
            // });
        } catch (error) {
            console.error('Failed to send Telegram alert:', error);
        }
    }

    formatTelegramMessage(coin) {
        const direction = coin.prediction.type === 'pump' ? '🚀 PUMP' : '📉 DUMP';
        const change = Math.abs(coin.prediction.change);
        
        return `
<b>${direction} ALERT - ${coin.symbol}</b>

💰 Current Price: $${coin.price.toFixed(4)}
🎯 Predicted Move: ${change.toFixed(1)}% in 10 minutes
📊 Confidence: ${coin.prediction.confidence}%
⚠️ Risk Level: ${coin.prediction.risk}%

<b>TRADING SETUP:</b>
🎯 Entry: $${coin.price.toFixed(4)}
✅ Take Profit: $${(coin.price * (1 + change / 100)).toFixed(4)}
❌ Stop Loss: $${(coin.price * (1 - change / 200)).toFixed(4)}
⚡ Leverage: 10x

<code>RSI: ${Math.floor(Math.random() * 30) + 35} | VOL: ${(Math.random() * 1000).toFixed(0)}M</code>
        `.trim();
    }

    refreshAnalysis() {
        this.logActivity('Manual analysis refresh requested.');
        this.updateMarketData();
    }

    updateTimeFrame(timeframe) {
        this.logActivity(`Timeframe updated to: ${timeframe}`);
        // In real implementation, this would affect the analysis
    }

    logActivity(message, type = 'info') {
        const time = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.innerHTML = `
            <span class="log-time">${time}</span>
            <span class="log-message">${message}</span>
        `;
        
        elements.activityLog.prepend(logEntry);
        
        // Keep only last 50 entries
        const entries = elements.activityLog.querySelectorAll('.log-entry');
        if (entries.length > 50) {
            entries[entries.length - 1].remove();
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CryptoTrader();
});

// Utility function for risk colors
const riskColors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444'
};
