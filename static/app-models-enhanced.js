/**
 * OLLAMA MODEL STORE - Enhanced Implementation
 * Full library browsing, natural language search, compatibility detection
 */

// ================================================================
//   GLOBAL STATE
// ================================================================

const ModelStore = {
    libraryModels: [],
    installedModels: [],
    runningModels: [],
    systemSpecs: null,
    categories: ['all', 'chat', 'code', 'vision', 'embedding', 'instruct', 'uncensored'],
    activeCategory: 'all',
    searchQuery: '',
    sortMode: 'popular',
    viewMode: 'grid', // grid or list
    pullInProgress: false,
    currentDeleteName: null
};

// ================================================================
//   OLLAMA LIBRARY FETCHER
// ================================================================

const OllamaLibrary = {
    // Curated model database (based on ollama.com/library)
    models: [
        // CHAT MODELS
        { name: 'llama3.2', family: 'llama', author: 'Meta', desc: 'Latest Llama model with improved performance', category: 'chat', params: '3B', sizes: ['1b', '3b'], popular: 95, bestFor: ['General chat', 'Q&A', 'Summarization'], minRAM: 4, minVRAM: 2 },
        { name: 'llama3.1', family: 'llama', author: 'Meta', desc: 'Powerful multilingual model', category: 'chat', params: '8B', sizes: ['8b', '70b', '405b'], popular: 98, bestFor: ['Advanced reasoning', 'Long context', 'Multilingual'], minRAM: 8, minVRAM: 6 },
        { name: 'llama3', family: 'llama', author: 'Meta', desc: 'Meta Llama 3 foundation model', category: 'chat', params: '8B', sizes: ['8b', '70b'], popular: 92, bestFor: ['Chat', 'Instruction following'], minRAM: 8, minVRAM: 6 },
        { name: 'mistral', family: 'mistral', author: 'Mistral AI', desc: 'High-performance 7B model', category: 'chat', params: '7B', sizes: ['7b'], popular: 90, bestFor: ['Fast inference', 'General purpose'], minRAM: 8, minVRAM: 4 },
        { name: 'mixtral', family: 'mistral', author: 'Mistral AI', desc: 'Mixture of Experts model', category: 'chat', params: '8x7B', sizes: ['8x7b', '8x22b'], popular: 88, bestFor: ['Complex reasoning', 'High quality'], minRAM: 48, minVRAM: 24 },
        { name: 'phi3', family: 'phi', author: 'Microsoft', desc: 'Small but powerful model', category: 'chat', params: '3.8B', sizes: ['mini', 'medium'], popular: 85, bestFor: ['Edge devices', 'Fast responses'], minRAM: 4, minVRAM: 2 },
        { name: 'gemma2', family: 'gemma', author: 'Google', desc: 'Google Gemma 2 model', category: 'chat', params: '9B', sizes: ['2b', '9b', '27b'], popular: 87, bestFor: ['Efficient inference', 'Quality output'], minRAM: 8, minVRAM: 6 },
        { name: 'qwen2.5', family: 'qwen', author: 'Alibaba', desc: 'Qwen 2.5 multilingual model', category: 'chat', params: '7B', sizes: ['0.5b', '1.5b', '3b', '7b', '14b', '32b', '72b'], popular: 83, bestFor: ['Multilingual', 'Math', 'Coding'], minRAM: 8, minVRAM: 4 },
        { name: 'deepseek-r1', family: 'deepseek', author: 'DeepSeek', desc: 'Reasoning-focused model', category: 'chat', params: '7B', sizes: ['1.5b', '7b', '8b', '14b', '32b', '70b', '671b'], popular: 94, bestFor: ['Complex reasoning', 'Math', 'Logic'], minRAM: 8, minVRAM: 6 },
        
        // CODE MODELS
        { name: 'codellama', family: 'llama', author: 'Meta', desc: 'Code generation specialist', category: 'code', params: '7B', sizes: ['7b', '13b', '34b', '70b'], popular: 89, bestFor: ['Code completion', 'Code explanation'], minRAM: 8, minVRAM: 4 },
        { name: 'qwen2.5-coder', family: 'qwen', author: 'Alibaba', desc: 'Advanced coding model', category: 'code', params: '7B', sizes: ['1.5b', '7b', '32b'], popular: 91, bestFor: ['Code generation', 'Debugging', 'Refactoring'], minRAM: 8, minVRAM: 4 },
        { name: 'starcoder2', family: 'starcoder', author: 'BigCode', desc: 'Code-focused model', category: 'code', params: '15B', sizes: ['3b', '7b', '15b'], popular: 82, bestFor: ['Multi-language coding', 'Code review'], minRAM: 16, minVRAM: 8 },
        { name: 'codegemma', family: 'gemma', author: 'Google', desc: 'Google code model', category: 'code', params: '7B', sizes: ['2b', '7b'], popular: 80, bestFor: ['Code completion', 'Code chat'], minRAM: 8, minVRAM: 4 },
        
        // VISION MODELS
        { name: 'llava', family: 'llava', author: 'LLaVA Team', desc: 'Vision-language model', category: 'vision', params: '7B', sizes: ['7b', '13b', '34b'], popular: 86, bestFor: ['Image understanding', 'Visual Q&A'], minRAM: 8, minVRAM: 6 },
        { name: 'llava-phi3', family: 'llava', author: 'LLaVA Team', desc: 'Efficient vision model', category: 'vision', params: '3.8B', sizes: ['mini'], popular: 78, bestFor: ['Fast image analysis', 'Edge vision'], minRAM: 4, minVRAM: 3 },
        { name: 'bakllava', family: 'llava', author: 'SkunkworksAI', desc: 'Enhanced vision model', category: 'vision', params: '7B', sizes: ['7b'], popular: 75, bestFor: ['Detailed image analysis'], minRAM: 8, minVRAM: 6 },
        
        // EMBEDDING MODELS
        { name: 'nomic-embed-text', family: 'nomic', author: 'Nomic AI', desc: 'Text embedding model', category: 'embedding', params: '137M', sizes: ['v1.5'], popular: 84, bestFor: ['Semantic search', 'RAG', 'Clustering'], minRAM: 2, minVRAM: 1 },
        { name: 'mxbai-embed-large', family: 'mxbai', author: 'MixedBread', desc: 'Large embedding model', category: 'embedding', params: '335M', sizes: ['latest'], popular: 79, bestFor: ['High-quality embeddings', 'Retrieval'], minRAM: 2, minVRAM: 1 },
        { name: 'all-minilm', family: 'minilm', author: 'Microsoft', desc: 'Compact embedding model', category: 'embedding', params: '33M', sizes: ['l6-v2'], popular: 76, bestFor: ['Fast embeddings', 'Low resource'], minRAM: 1, minVRAM: 0.5 },
        
        // UNCENSORED MODELS
        { name: 'dolphin-mistral', family: 'mistral', author: 'Eric Hartford', desc: 'Uncensored Mistral variant', category: 'uncensored', params: '7B', sizes: ['7b'], popular: 81, bestFor: ['Unrestricted chat', 'Creative writing'], minRAM: 8, minVRAM: 4 },
        { name: 'wizard-vicuna-uncensored', family: 'vicuna', author: 'Eric Hartford', desc: 'Uncensored assistant', category: 'uncensored', params: '13B', sizes: ['13b'], popular: 77, bestFor: ['Open conversations', 'No filters'], minRAM: 16, minVRAM: 8 },
        
        // SPECIALIZED MODELS
        { name: 'solar', family: 'solar', author: 'Upstage', desc: 'High-performance Korean model', category: 'chat', params: '10.7B', sizes: ['10.7b'], popular: 74, bestFor: ['Korean language', 'Multilingual'], minRAM: 12, minVRAM: 8 },
        { name: 'yi', family: 'yi', author: '01.AI', desc: 'Bilingual Chinese-English model', category: 'chat', params: '34B', sizes: ['6b', '9b', '34b'], popular: 73, bestFor: ['Chinese', 'Bilingual tasks'], minRAM: 32, minVRAM: 16 },
        { name: 'orca-mini', family: 'orca', author: 'Microsoft', desc: 'Compact reasoning model', category: 'chat', params: '3B', sizes: ['3b', '7b', '13b'], popular: 72, bestFor: ['Reasoning', 'Small footprint'], minRAM: 4, minVRAM: 2 },
        { name: 'neural-chat', family: 'neural', author: 'Intel', desc: 'Optimized chat model', category: 'chat', params: '7B', sizes: ['7b'], popular: 70, bestFor: ['CPU inference', 'Chat'], minRAM: 8, minVRAM: 0 },
        { name: 'starling-lm', family: 'starling', author: 'Berkeley', desc: 'RLHF-trained model', category: 'chat', params: '7B', sizes: ['7b'], popular: 71, bestFor: ['Helpful responses', 'Safety'], minRAM: 8, minVRAM: 4 },
        { name: 'openchat', family: 'openchat', author: 'OpenChat', desc: 'Open-source chat model', category: 'chat', params: '7B', sizes: ['7b'], popular: 69, bestFor: ['General chat', 'Open source'], minRAM: 8, minVRAM: 4 },
        { name: 'vicuna', family: 'vicuna', author: 'LMSYS', desc: 'Fine-tuned LLaMA model', category: 'chat', params: '13B', sizes: ['7b', '13b', '33b'], popular: 68, bestFor: ['Detailed responses', 'Chat'], minRAM: 16, minVRAM: 8 },
        { name: 'tinyllama', family: 'llama', author: 'TinyLlama', desc: 'Compact 1.1B model', category: 'chat', params: '1.1B', sizes: ['1.1b'], popular: 67, bestFor: ['Edge devices', 'Fast inference'], minRAM: 2, minVRAM: 1 },
        { name: 'falcon', family: 'falcon', author: 'TII', desc: 'Open-source LLM', category: 'chat', params: '7B', sizes: ['7b', '40b', '180b'], popular: 66, bestFor: ['General purpose', 'Research'], minRAM: 8, minVRAM: 4 }
    ],

    // Natural language search keywords
    searchKeywords: {
        'coding': ['code', 'qwen2.5-coder', 'codellama', 'starcoder2', 'codegemma'],
        'programming': ['code', 'qwen2.5-coder', 'codellama', 'starcoder2'],
        'chat': ['llama3.2', 'llama3.1', 'mistral', 'phi3', 'gemma2'],
        'small': ['phi3', 'tinyllama', 'llama3.2:1b', 'gemma2:2b', 'qwen2.5:0.5b'],
        'fast': ['phi3', 'tinyllama', 'mistral', 'llama3.2'],
        'vision': ['llava', 'llava-phi3', 'bakllava'],
        'image': ['llava', 'llava-phi3', 'bakllava'],
        'embedding': ['nomic-embed-text', 'mxbai-embed-large', 'all-minilm'],
        'uncensored': ['dolphin-mistral', 'wizard-vicuna-uncensored'],
        'reasoning': ['deepseek-r1', 'qwen2.5', 'mixtral'],
        'math': ['deepseek-r1', 'qwen2.5', 'llama3.1'],
        'multilingual': ['qwen2.5', 'llama3.1', 'yi', 'solar'],
        'chinese': ['qwen2.5', 'yi'],
        'korean': ['solar'],
        'best': ['llama3.1', 'deepseek-r1', 'qwen2.5-coder', 'mixtral'],
        'powerful': ['llama3.1:70b', 'mixtral:8x22b', 'deepseek-r1:70b'],
        'efficient': ['phi3', 'gemma2', 'mistral', 'llama3.2']
    },

    // Search models with natural language
    search(query) {
        query = query.toLowerCase().trim();
        if (!query) return this.models;

        let results = [];
        let scores = new Map();

        // Check for keyword matches
        for (const [keyword, modelNames] of Object.entries(this.searchKeywords)) {
            if (query.includes(keyword)) {
                modelNames.forEach(name => {
                    const model = this.models.find(m => m.name.includes(name.split(':')[0]));
                    if (model) {
                        scores.set(model.name, (scores.get(model.name) || 0) + 10);
                    }
                });
            }
        }

        // Direct name/family match
        this.models.forEach(model => {
            let score = scores.get(model.name) || 0;
            
            if (model.name.toLowerCase().includes(query)) score += 20;
            if (model.family.toLowerCase().includes(query)) score += 15;
            if (model.desc.toLowerCase().includes(query)) score += 5;
            if (model.author.toLowerCase().includes(query)) score += 8;
            model.bestFor.forEach(use => {
                if (use.toLowerCase().includes(query)) score += 12;
            });
            
            if (score > 0) {
                scores.set(model.name, score);
            }
        });

        // Sort by score
        results = this.models.filter(m => scores.has(m.name))
            .sort((a, b) => scores.get(b.name) - scores.get(a.name));

        // If no results, return popular models
        return results.length > 0 ? results : this.models.slice().sort((a, b) => b.popular - a.popular).slice(0, 10);
    },

    // Get models by category
    getByCategory(category) {
        if (category === 'all') return this.models;
        return this.models.filter(m => m.category === category);
    },

    // Get featured models
    getFeatured() {
        return this.models.filter(m => m.popular >= 85).slice(0, 6);
    },

    // Get model details
    getModel(name) {
        return this.models.find(m => m.name === name);
    }
};

// ================================================================
//   SYSTEM DETECTION
// ================================================================

const SystemDetector = {
    specs: null,

    async detect() {
        const specs = {
            ram: this.detectRAM(),
            vram: await this.detectVRAM(),
            cpu: navigator.hardwareConcurrency || 4,
            platform: navigator.platform,
            gpu: await this.detectGPU()
        };
        
        this.specs = specs;
        ModelStore.systemSpecs = specs;
        return specs;
    },

    detectRAM() {
        // navigator.deviceMemory in GB (Chrome/Edge only)
        if (navigator.deviceMemory) {
            return navigator.deviceMemory;
        }
        // Fallback: estimate based on performance
        return 8; // Default assumption
    },

    async detectVRAM() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) return 0;

            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                // Parse VRAM from renderer string (rough estimate)
                const vramMatch = renderer.match(/(\d+)(?:GB|MB)/i);
                if (vramMatch) {
                    const value = parseInt(vramMatch[1]);
                    return renderer.includes('GB') ? value : value / 1024;
                }
            }

            // Fallback: check for dedicated GPU
            return 4; // Default assumption for dedicated GPU
        } catch (e) {
            return 0; // No GPU detected
        }
    },

    async detectGPU() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) return 'None';

            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
            return 'Unknown GPU';
        } catch (e) {
            return 'None';
        }
    },

    canRunModel(model) {
        if (!this.specs) return { can: true, reason: 'Unknown' };

        const requiredRAM = model.minRAM || 4;
        const requiredVRAM = model.minVRAM || 0;

        if (this.specs.ram < requiredRAM) {
            return {
                can: false,
                reason: `Requires ${requiredRAM}GB RAM (you have ${this.specs.ram}GB)`
            };
        }

        if (requiredVRAM > 0 && this.specs.vram < requiredVRAM) {
            return {
                can: false,
                reason: `Requires ${requiredVRAM}GB VRAM (you have ${this.specs.vram}GB)`
            };
        }

        return { can: true, reason: 'Compatible' };
    }
};

// Export for use in main app
window.ModelStore = ModelStore;
window.OllamaLibrary = OllamaLibrary;
window.SystemDetector = SystemDetector;
