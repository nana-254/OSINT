/**
 * Canvas Liquid Wave Gauges
 * Animate gauge rings with smooth wave/liquid fill effects
 * Supports real-time value updates with smooth transitions
 */

class LiquidWaveGauge {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas element with id "${canvasId}" not found`);
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.options = {
            value: 0,
            max: 100,
            waveHeight: 8,
            waveFrequency: 0.02,
            wavePhase: 0,
            waveSpeed: 0.15,
            radius: 42,
            ringWidth: 9,
            gapStart: 0,
            gapEnd: 0,
            colorClass: 'cyan',
            targetValue: 0,
            currentValue: 0,
            animationDuration: 800,
            animationStartTime: null,
            ...options
        };
        
        // Set canvas size
        const rect = this.canvas.parentElement.querySelector('svg')?.getBoundingClientRect();
        if (rect && rect.width && rect.height) {
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        } else {
            this.canvas.width = this.canvas.offsetWidth || 160;
            this.canvas.height = this.canvas.offsetHeight || 160;
        }
        
        // Color palette
        this.colors = {
            cyan: { start: '#00F2FE', end: '#4FACFE', glow: 'rgba(0, 242, 254, 0.3)' },
            green: { start: '#00F260', end: '#00FF87', glow: 'rgba(0, 242, 96, 0.3)' },
            amber: { start: '#F7971E', end: '#FFD200', glow: 'rgba(247, 151, 30, 0.3)' },
            crimson: { start: '#FF416C', end: '#FF4B2B', glow: 'rgba(255, 65, 108, 0.3)' }
        };
        
        this.animate = this.animate.bind(this);
        this.isAnimating = false;
    }
    
    setValue(value) {
        this.options.targetValue = Math.min(Math.max(value, 0), this.options.max);
        this.options.animationStartTime = performance.now();
        
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.animate();
        }
    }
    
    animate(timestamp = performance.now()) {
        if (!this.options.animationStartTime) {
            this.options.animationStartTime = timestamp;
        }
        
        const elapsed = timestamp - this.options.animationStartTime;
        const progress = Math.min(elapsed / this.options.animationDuration, 1);
        
        // Smooth easing: cubic-bezier(0.4, 0, 0.2, 1)
        const easeProgress = this.easingCubicBezier(progress, 0.4, 0, 0.2, 1);
        
        this.options.currentValue = this.options.value + 
            (this.options.targetValue - this.options.value) * easeProgress;
        
        // Update wave phase
        this.options.wavePhase += this.options.waveSpeed;
        
        // Render
        this.draw();
        
        if (progress < 1 || Math.abs(this.options.targetValue - this.options.currentValue) > 0.1) {
            this.isAnimating = true;
            requestAnimationFrame(this.animate);
        } else {
            this.options.value = this.options.targetValue;
            this.options.currentValue = this.options.targetValue;
            this.isAnimating = false;
        }
    }
    
    easingCubicBezier(t, p0, p1, p2, p3) {
        // Cubic Bezier easing function
        const mt = 1 - t;
        return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
    }
    
    draw() {
        const { width, height } = this.canvas;
        const centerX = width / 2;
        const centerY = height / 2;
        const scale = Math.min(width, height) / 160; // Normalize to 160px base
        const radius = this.options.radius * scale;
        const ringWidth = this.options.ringWidth * scale;
        const waveHeight = this.options.waveHeight * scale;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);
        
        // Draw outer ring background track
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        this.ctx.lineWidth = ringWidth;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw wave-filled ring
        this.drawWaveRing(centerX, centerY, radius, ringWidth, waveHeight);
        
        // Draw glow effect
        this.drawGlowRing(centerX, centerY, radius, ringWidth);
    }
    
    drawWaveRing(centerX, centerY, radius, ringWidth, waveHeight) {
        const pct = this.options.currentValue / this.options.max;
        const circumference = 2 * Math.PI * radius;
        const dashLength = circumference * pct;
        
        // Get gradient color
        const colorKey = this.options.colorClass;
        const color = this.colors[colorKey] || this.colors.cyan;
        
        // Create radial gradient for depth
        const gradient = this.ctx.createLinearGradient(
            centerX - radius, centerY,
            centerX + radius, centerY
        );
        gradient.addColorStop(0, color.start);
        gradient.addColorStop(1, color.end);
        
        // Create clipping region for wave animation
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius + ringWidth / 2, 0, Math.PI * 2);
        this.ctx.arc(centerX, centerY, radius - ringWidth / 2, Math.PI * 2, 0, true);
        this.ctx.clip('evenodd');
        
        // Draw animated wave pattern
        this.drawWavePattern(centerX, centerY, radius, waveHeight, gradient, dashLength, circumference);
        
        this.ctx.restore();
    }
    
    drawWavePattern(centerX, centerY, radius, waveHeight, gradient, dashLength, circumference) {
        const segments = 180; // Number of wave segments around the circle
        const startAngle = -Math.PI / 2; // Start at top (standard gauge angle)
        
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = this.options.ringWidth * Math.min(this.canvas.width, this.canvas.height) / 160;
        this.ctx.lineCap = 'round';
        
        // Draw the wave ring arc with wave distortion
        this.ctx.beginPath();
        let totalLen = 0;
        
        for (let i = 0; i <= segments; i++) {
            const ratio = i / segments;
            const angle = startAngle + ratio * Math.PI * 2 * (dashLength / circumference);
            
            // Wave height increases then decreases based on position in arc
            const waveInfluence = Math.sin(ratio * Math.PI) * 0.5; // 0 to 0.5 to 0
            
            // Add sine wave oscillation based on phase
            const waveY = Math.sin(
                ratio * Math.PI * 6 + this.options.wavePhase
            ) * waveHeight * waveInfluence;
            
            // Position on the ring with wave distortion
            const r = radius + waveY;
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.stroke();
    }
    
    drawGlowRing(centerX, centerY, radius, ringWidth) {
        const colorKey = this.options.colorClass;
        const color = this.colors[colorKey] || this.colors.cyan;
        
        // Inner glow
        const glowGradient = this.ctx.createRadialGradient(
            centerX, centerY, radius - ringWidth / 2,
            centerX, centerY, radius + ringWidth / 2
        );
        glowGradient.addColorStop(0, color.glow);
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius + ringWidth, 0, Math.PI * 2);
        this.ctx.arc(centerX, centerY, radius - ringWidth, Math.PI * 2, 0, true);
        this.ctx.fill('evenodd');
    }
    
    setColor(colorClass) {
        this.options.colorClass = colorClass;
    }
    
    destroy() {
        this.isAnimating = false;
        if (this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

// Global gauge instances
window.gaugeInstances = {};

/**
 * Initialize all canvas wave gauges on the page
 */
function initCanvasWaveGauges() {
    const gaugeConfigs = [
        {
            canvasId: 'vram-wave-canvas',
            svgId: 'vram-ring',
            colorClass: 'cyan',
            labelId: 'vram-value'
        },
        {
            canvasId: 'cpu-wave-canvas',
            svgId: 'cpu-ring',
            colorClass: 'green',
            labelId: 'cpu-value'
        },
        {
            canvasId: 'ram-wave-canvas',
            svgId: 'ram-ring',
            colorClass: 'cyan',
            labelId: 'ram-value'
        },
        {
            canvasId: 'temp-wave-canvas',
            svgId: 'temp-ring',
            colorClass: 'amber',
            labelId: 'temp-value'
        }
    ];
    
    gaugeConfigs.forEach(config => {
        // Check if canvas exists
        const canvas = document.getElementById(config.canvasId);
        if (!canvas) return;
        
        const gauge = new LiquidWaveGauge(config.canvasId, {
            colorClass: config.colorClass
        });
        
        window.gaugeInstances[config.canvasId] = gauge;
    });
}

/**
 * Update a gauge by canvas ID
 */
function updateWaveGauge(canvasId, value) {
    const gauge = window.gaugeInstances[canvasId];
    if (gauge) {
        gauge.setValue(value);
    }
}

/**
 * Update all gauges from telemetry data
 */
function updateAllWaveGauges(telemetryData) {
    if (telemetryData.vram !== undefined) {
        updateWaveGauge('vram-wave-canvas', telemetryData.vram);
    }
    if (telemetryData.ram !== undefined) {
        updateWaveGauge('ram-wave-canvas', telemetryData.ram);
    }
    if (telemetryData.temp !== undefined) {
        // Scale temperature to 0-100 range (0-100°C)
        updateWaveGauge('temp-wave-canvas', telemetryData.temp);
    }
    // CPU gauge will be driven separately if needed
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCanvasWaveGauges);
} else {
    initCanvasWaveGauges();
}
